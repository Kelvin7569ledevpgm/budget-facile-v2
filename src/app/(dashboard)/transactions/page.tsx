'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Download, Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader, Modal, Input, Select, Skeleton } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useUserPreferences } from '@/contexts/UserPreferencesProvider';
import { formatSignedCurrencyAmount } from '@/lib/user-preferences';
import styles from './TransactionsPage.module.css';

export type TransactionRow = {
  id: string;
  label: string;
  category: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  account: string;
  status: 'completed' | 'pending';
};

/** Comptes utilisés uniquement pour le parcours /demo (données factices). */
const DEMO_ACCOUNTS = ['Compte principal', 'Livret A', 'Carte Visa', 'Pro'];

/** Catégories utilisées uniquement pour le parcours /demo (données factices). */
const DEMO_CATEGORIES = [
  'Technologie',
  'Revenus',
  'Restauration',
  'Logement',
  'Shopping',
  'Divertissement',
  'Transport',
];

/** Données factices pour le parcours /demo (sans compte, sans Supabase) */
const DEMO_TRANSACTIONS: TransactionRow[] = [
  {
    id: 'demo-1',
    label: 'Apple Store',
    category: 'Technologie',
    date: '2026-06-14',
    amount: -1299,
    type: 'expense',
    account: 'Carte Visa',
    status: 'completed',
  },
  {
    id: 'demo-2',
    label: 'Salaire mensuel',
    category: 'Revenus',
    date: '2026-06-01',
    amount: 4500,
    type: 'income',
    account: 'Compte principal',
    status: 'completed',
  },
  {
    id: 'demo-3',
    label: 'Uber Eats',
    category: 'Restauration',
    date: '2026-06-12',
    amount: -34.5,
    type: 'expense',
    account: 'Carte Visa',
    status: 'completed',
  },
  {
    id: 'demo-4',
    label: 'Loyer juin',
    category: 'Logement',
    date: '2026-06-01',
    amount: -1200,
    type: 'expense',
    account: 'Compte principal',
    status: 'pending',
  },
  {
    id: 'demo-5',
    label: 'Amazon.fr',
    category: 'Shopping',
    date: '2026-06-10',
    amount: -89.99,
    type: 'expense',
    account: 'Carte Visa',
    status: 'completed',
  },
];

function mapFromDb(row: Record<string, unknown>): TransactionRow {
  return {
    id: String(row.id),
    label: String(row.label),
    category: String(row.category),
    date: String(row.date).slice(0, 10),
    amount: Number(row.amount),
    type: row.type as 'income' | 'expense',
    account: String(row.account),
    status: row.status as 'completed' | 'pending',
  };
}

function formatDisplayDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function exportCsv(rows: TransactionRow[]) {
  const header = ['Libellé', 'Catégorie', 'Date', 'Montant', 'Type', 'Compte', 'Statut'];
  const lines = rows.map((r) =>
    [
      `"${r.label.replace(/"/g, '""')}"`,
      r.category,
      r.date,
      r.amount,
      r.type,
      `"${r.account}"`,
      r.status,
    ].join(',')
  );
  const csv = [header.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions-budgetfacile-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TransactionsPage() {
  const pathname = usePathname();
  const isDemo = pathname.startsWith('/demo');
  const { preferences } = useUserPreferences();
  const compact = preferences.compact;

  /** Filtre + nouvelles transactions : catégories des paramètres (ou liste démo). */
  const settingsCategories = useMemo(() => {
    if (isDemo) return DEMO_CATEGORIES;
    return preferences.categories;
  }, [isDemo, preferences.categories]);

  /** Filtre + formulaire : comptes définis dans les paramètres (ou liste démo). */
  const settingsAccounts = useMemo(() => {
    if (isDemo) return DEMO_ACCOUNTS;
    return preferences.accounts;
  }, [isDemo, preferences.accounts]);

  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: '',
    category: '',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    type: 'expense' as 'income' | 'expense',
    account: '',
    status: 'completed' as 'completed' | 'pending',
  });

  /** Formulaire : paramètres + libellé actuel si une transaction utilise une ancienne catégorie. */
  const formCategoryOptions = useMemo(() => {
    const base = settingsCategories;
    if (form.category && !base.includes(form.category)) {
      return [...base, form.category];
    }
    return base;
  }, [settingsCategories, form.category]);

  const formAccountOptions = useMemo(() => {
    const base = settingsAccounts;
    if (form.account && !base.includes(form.account)) {
      return [...base, form.account];
    }
    return base;
  }, [settingsAccounts, form.account]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setRows([]);
        return;
      }
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      setRows((data ?? []).map((r) => mapFromDb(r as Record<string, unknown>)));
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : 'Impossible de charger les transactions (vérifiez Supabase).'
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDemo) {
      setRows(DEMO_TRANSACTIONS);
      setLoadError(null);
      setLoading(false);
      return;
    }
    loadTransactions();
  }, [isDemo, loadTransactions]);

  /** Si le filtre pointe vers une catégorie retirée des paramètres, on repasse sur « Toutes ». */
  useEffect(() => {
    if (category && !settingsCategories.includes(category)) {
      setCategory('');
    }
  }, [category, settingsCategories]);

  useEffect(() => {
    if (account && !settingsAccounts.includes(account)) {
      setAccount('');
    }
  }, [account, settingsAccounts]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = search.trim().toLowerCase();
      if (q && !r.label.toLowerCase().includes(q) && !r.category.toLowerCase().includes(q)) {
        return false;
      }
      if (category && r.category !== category) return false;
      if (account && r.account !== account) return false;
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      return true;
    });
  }, [rows, search, category, account, typeFilter, dateFrom, dateTo]);

  function openNew() {
    setModalError(null);
    setEditingId(null);
    setForm({
      label: '',
      category: settingsCategories[0] ?? '',
      date: new Date().toISOString().slice(0, 10),
      amount: '',
      type: 'expense',
      account: settingsAccounts[0] ?? '',
      status: 'completed',
    });
    setModalOpen(true);
  }

  function openEdit(row: TransactionRow) {
    setModalError(null);
    setEditingId(row.id);
    setForm({
      label: row.label,
      category: row.category,
      date: row.date,
      amount: String(Math.abs(row.amount)),
      type: row.type,
      account: row.account,
      status: row.status,
    });
    setModalOpen(true);
  }

  async function saveModal() {
    setModalError(null);
    const raw = parseFloat(form.amount.replace(',', '.'));
    if (!form.label.trim() || Number.isNaN(raw)) return;
    if (!form.category.trim()) {
      setModalError('Choisissez une catégorie.');
      return;
    }
    if (!form.account.trim()) {
      setModalError('Choisissez un compte.');
      return;
    }
    const signed = form.type === 'expense' ? -Math.abs(raw) : Math.abs(raw);
    if (isDemo) {
      if (editingId) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === editingId
              ? {
                  ...r,
                  label: form.label.trim(),
                  category: form.category,
                  date: form.date,
                  amount: signed,
                  type: form.type,
                  account: form.account,
                  status: form.status,
                }
              : r
          )
        );
      } else {
        const id = `demo-${Date.now()}`;
        setRows((prev) => [
          {
            id,
            label: form.label.trim(),
            category: form.category,
            date: form.date,
            amount: signed,
            type: form.type,
            account: form.account,
            status: form.status,
          },
          ...prev,
        ]);
      }
      setModalOpen(false);
      return;
    }
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setModalError('Session expirée. Reconnectez-vous.');
        return;
      }
      if (editingId) {
        const { error } = await supabase
          .from('transactions')
          .update({
            label: form.label.trim(),
            category: form.category,
            date: form.date,
            amount: signed,
            type: form.type,
            account: form.account,
            status: form.status,
          })
          .eq('id', editingId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('transactions').insert({
          user_id: user.id,
          label: form.label.trim(),
          category: form.category,
          date: form.date,
          amount: signed,
          type: form.type,
          account: form.account,
          status: form.status,
        });
        if (error) throw error;
      }
      await loadTransactions();
      setModalOpen(false);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    }
  }

  async function removeRow(id: string) {
    if (isDemo) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      return;
    }
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadTransactions();
    } catch {
      /* silencieux : erreur réseau */
    }
  }

  return (
    <div className={compact ? styles.pageCompact : undefined}>
      {loadError ? (
        <div
          className="card"
          style={{
            marginBottom: 'var(--spacing-md)',
            padding: 'var(--spacing-md)',
            borderColor: 'var(--color-danger)',
            color: 'var(--color-danger)',
          }}
        >
          {loadError}
        </div>
      ) : null}
      <PageHeader
        title="Transactions"
        description="Recherchez, filtrez et gérez toutes vos opérations."
        actions={
          <div className={styles.headerActions}>
            <button
              type="button"
              className={`btn btn--secondary ${styles.headerActionBtn}`}
              onClick={() => exportCsv(filtered)}
            >
              <Download size={18} strokeWidth={2} />
              Exporter
            </button>
            <button type="button" className={`btn btn--primary ${styles.headerActionBtn}`} onClick={openNew}>
              <Plus size={18} strokeWidth={2} />
              Nouvelle transaction
            </button>
          </div>
        }
      />

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
          <button
            type="button"
            className={`btn btn--primary ${styles.toolbarAddBtn}`}
            onClick={openNew}
          >
            <Plus size={20} strokeWidth={2} />
            Ajouter une transaction
          </button>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search size={18} className={styles.searchIcon} aria-hidden />
              <input
                className={styles.searchInput}
                placeholder="Rechercher par libellé ou catégorie…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Recherche"
              />
            </div>
            <div className={styles.typeToggle} role="group" aria-label="Type">
              {(
                [
                  ['all', 'Tous'],
                  ['expense', 'Dépenses'],
                  ['income', 'Revenus'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.typeBtn} ${typeFilter === key ? styles.typeBtnActive : ''}`}
                  onClick={() => setTypeFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filtersRow}>
            <div className={styles.filterField}>
              <label htmlFor="f-from">Du</label>
              <input
                id="f-from"
                type="date"
                className="input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className={styles.filterField}>
              <label htmlFor="f-to">Au</label>
              <input id="f-to" type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className={styles.filterField}>
              <Select
                id="f-cat"
                label="Catégorie"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Toutes</option>
                {settingsCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className={styles.filterField}>
              <Select
                id="f-acc"
                label="Compte"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
              >
                <option value="">Tous</option>
                {settingsAccounts.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 'var(--spacing-md)' }}>
            <Skeleton style={{ height: '200px', width: '100%' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Aucune transaction</p>
            <p>Ajustez les filtres ou ajoutez une nouvelle opération.</p>
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <button
                type="button"
                className={`btn btn--primary btn--lg ${styles.emptyAddBtn}`}
                onClick={openNew}
              >
                <Plus size={18} strokeWidth={2} />
                Nouvelle transaction
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.desktopTable}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Transaction</th>
                      <th>Catégorie</th>
                      <th>Compte</th>
                      <th>Date</th>
                      <th>Statut</th>
                      <th className={styles.cellRight}>Montant</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(255,255,255,0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                              }}
                            >
                              {t.label.charAt(0)}
                            </div>
                            <span style={{ fontWeight: 600 }}>{t.label}</span>
                          </div>
                        </td>
                        <td className="text-muted">{t.category}</td>
                        <td className="text-muted">{t.account}</td>
                        <td>{formatDisplayDate(t.date)}</td>
                        <td>
                          <span
                            className={
                              t.status === 'completed' ? 'badge badge--success' : 'badge badge--warning'
                            }
                          >
                            {t.status === 'completed' ? 'Complété' : 'En attente'}
                          </span>
                        </td>
                        <td
                          className={`${styles.cellRight} ${styles.mono}`}
                          style={{
                            color: t.amount >= 0 ? 'var(--color-success)' : 'var(--color-text-primary)',
                            fontWeight: 700,
                          }}
                        >
                          {formatSignedCurrencyAmount(t.amount, preferences)}
                        </td>
                        <td className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            aria-label="Modifier"
                            onClick={() => openEdit(t)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            aria-label="Supprimer"
                            onClick={() => removeRow(t.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.mobileList} style={{ padding: 'var(--spacing-md)' }}>
              {filtered.map((t) => (
                <div key={t.id} className={styles.mobileCard}>
                  <div className={styles.mobileCardTop}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{t.label}</div>
                      <div className="text-caption" style={{ marginTop: '0.25rem' }}>
                        {t.category} · {t.account}
                      </div>
                      <div className="text-caption">{formatDisplayDate(t.date)}</div>
                    </div>
                    <div
                      className={styles.mobileCardAmt}
                      style={{ color: t.amount >= 0 ? 'var(--color-success)' : 'var(--color-text-primary)' }}
                    >
                      {formatSignedCurrencyAmount(t.amount, preferences)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={t.status === 'completed' ? 'badge badge--success' : 'badge badge--warning'}>
                      {t.status === 'completed' ? 'Complété' : 'En attente'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button type="button" className={styles.iconBtn} aria-label="Modifier" onClick={() => openEdit(t)}>
                        <Pencil size={16} />
                      </button>
                      <button type="button" className={styles.iconBtn} aria-label="Supprimer" onClick={() => removeRow(t.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        title={editingId ? 'Modifier la transaction' : 'Nouvelle transaction'}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        size="lg"
        footer={
          <div className={styles.modalFooter}>
            <button type="button" className={`btn btn--secondary ${styles.modalBtn}`} onClick={() => setModalOpen(false)}>
              Annuler
            </button>
            <button type="button" className={`btn btn--primary ${styles.modalBtn}`} onClick={saveModal}>
              {editingId ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        }
      >
        {modalError ? (
          <p style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{modalError}</p>
        ) : null}
        <div className={styles.formGrid}>
          <div className={styles.formRowFull}>
            <Input
              id="tx-label"
              label="Libellé"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Ex. Courses hebdomadaires"
              required
            />
          </div>
          <Select
            id="tx-type"
            label="Type"
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({ ...f, type: e.target.value as 'income' | 'expense' }))
            }
          >
            <option value="expense">Dépense</option>
            <option value="income">Revenu</option>
          </Select>
          <Input
            id="tx-amount"
            label={`Montant (${preferences.currency})`}
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="0,00"
          />
          <Select
            id="tx-cat"
            label="Catégorie"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {formCategoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            id="tx-acc"
            label="Compte"
            value={form.account}
            onChange={(e) => setForm((f) => ({ ...f, account: e.target.value }))}
          >
            {formAccountOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
          <Input
            id="tx-date"
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
          <Select
            id="tx-status"
            label="Statut"
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as 'completed' | 'pending' }))
            }
          >
            <option value="completed">Complété</option>
            <option value="pending">En attente</option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}
