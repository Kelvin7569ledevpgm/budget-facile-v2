'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Plus, Loader2 } from 'lucide-react';
import { PageHeader, Card, Modal, Input, Select } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useUserPreferences } from '@/contexts/UserPreferencesProvider';
import { mergePreferences, type BudgetPlafondsMap } from '@/lib/user-preferences';
import {
  currentMonthBounds,
  currentMonthLabelFr,
  spentByCategoryForAccount,
  type TxSlice,
} from '@/lib/budget-month';
import styles from './BudgetPage.module.css';

const ACCENT = '#2dd4bf';
const MUTED = '#52525b';

const CAT_COLORS = ['#2dd4bf', '#a78bfa', '#f87171', '#fbbf24', '#94a3b8', '#34d399', '#fb923c', '#60a5fa'];

const DEMO_BUDGET_PIE = [
  { name: 'Dépensé', value: 74, color: ACCENT },
  { name: 'Restant', value: 26, color: MUTED },
];

const DEMO_CATEGORIES = [
  { icon: '🏠', name: 'Logement', spent: 1200, total: 1200, color: ACCENT },
  { icon: '🚗', name: 'Transport', spent: 450, total: 500, color: '#a78bfa' },
  { icon: '🍔', name: 'Alimentation', spent: 850, total: 800, color: '#f87171' },
  { icon: '🎮', name: 'Loisirs', spent: 200, total: 400, color: '#fbbf24' },
  { icon: '🏥', name: 'Santé', spent: 120, total: 200, color: '#94a3b8' },
];

const EMPTY_PIE = [
  { name: 'Dépensé', value: 0, color: ACCENT },
  { name: 'Non alloué', value: 100, color: MUTED },
];

export default function BudgetPage() {
  const { preferences, formatCurrency, refresh } = useUserPreferences();
  const compact = preferences.compact;
  const pathname = usePathname();
  const isDemo = pathname.startsWith('/demo');
  const basePath = isDemo ? '/demo' : '';

  const [selectedAccount, setSelectedAccount] = useState('');
  const [txRows, setTxRows] = useState<TxSlice[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const [plafondModalOpen, setPlafondModalOpen] = useState(false);
  const [plafondDraft, setPlafondDraft] = useState<Record<string, string>>({});
  const [savingPlafonds, setSavingPlafonds] = useState(false);
  const [plafondError, setPlafondError] = useState<string | null>(null);

  useEffect(() => {
    if (!preferences.accounts.length) return;
    if (!selectedAccount || !preferences.accounts.includes(selectedAccount)) {
      setSelectedAccount(preferences.accounts[0]);
    }
  }, [preferences.accounts, selectedAccount]);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    async function load() {
      setLoadingTx(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { from, to } = currentMonthBounds();
        const { data, error } = await supabase
          .from('transactions')
          .select('category, amount, type, account, date')
          .eq('user_id', user.id)
          .gte('date', from)
          .lte('date', to);
        if (error) throw error;
        if (!cancelled) {
          setTxRows(
            (data ?? []).map((r) => ({
              category: String(r.category),
              amount: Number(r.amount),
              type: String(r.type),
              account: String(r.account),
              date: String(r.date).slice(0, 10),
            }))
          );
        }
      } catch {
        if (!cancelled) setTxRows([]);
      } finally {
        if (!cancelled) setLoadingTx(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isDemo, preferences.categories, preferences.accounts]);

  const spentMap = useMemo(() => {
    if (isDemo || !selectedAccount) return {};
    const { from, to } = currentMonthBounds();
    return spentByCategoryForAccount(txRows, selectedAccount, from, to);
  }, [isDemo, txRows, selectedAccount]);

  const liveCategories = useMemo(() => {
    if (isDemo) return DEMO_CATEGORIES;
    return preferences.categories.map((name, i) => {
      const total = preferences.budgetPlafonds[selectedAccount]?.[name] ?? 0;
      const spent = spentMap[name] ?? 0;
      return {
        icon: null as string | null,
        name,
        spent,
        total,
        color: CAT_COLORS[i % CAT_COLORS.length],
      };
    });
  }, [isDemo, preferences.categories, preferences.budgetPlafonds, selectedAccount, spentMap]);

  const totalAllocated = useMemo(
    () => liveCategories.reduce((s, c) => s + c.total, 0),
    [liveCategories]
  );
  const totalSpentSum = useMemo(
    () => liveCategories.reduce((s, c) => s + c.spent, 0),
    [liveCategories]
  );

  const budgetPie = useMemo(() => {
    if (isDemo) return DEMO_BUDGET_PIE;
    if (totalAllocated <= 0) return EMPTY_PIE;
    const spentPct = Math.min(100, (totalSpentSum / totalAllocated) * 100);
    const rest = Math.max(0, 100 - spentPct);
    return [
      { name: 'Dépensé', value: Math.round(spentPct * 10) / 10, color: ACCENT },
      { name: 'Restant', value: Math.round(rest * 10) / 10, color: MUTED },
    ];
  }, [isDemo, totalAllocated, totalSpentSum]);

  const pctUsed =
    isDemo ? 74 : totalAllocated > 0 ? Math.min(100, Math.round((totalSpentSum / totalAllocated) * 100)) : 0;

  const spentLabel = isDemo ? '4 820 €' : formatCurrency(totalSpentSum);
  const remainingLabel = isDemo ? '1 680 €' : formatCurrency(Math.max(0, totalAllocated - totalSpentSum));

  const openPlafondModal = useCallback(() => {
    if (!selectedAccount) return;
    setPlafondError(null);
    const m = preferences.budgetPlafonds[selectedAccount] ?? {};
    const draft: Record<string, string> = {};
    for (const cat of preferences.categories) {
      draft[cat] = m[cat] != null && m[cat] > 0 ? String(m[cat]) : '';
    }
    setPlafondDraft(draft);
    setPlafondModalOpen(true);
  }, [preferences.budgetPlafonds, preferences.categories, selectedAccount]);

  const savePlafonds = useCallback(async () => {
    if (isDemo || !selectedAccount) return;
    setSavingPlafonds(true);
    setPlafondError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setPlafondError('Session expirée.');
        return;
      }
      const caps: Record<string, number> = {};
      for (const cat of preferences.categories) {
        const raw = plafondDraft[cat]?.replace(',', '.').trim();
        if (!raw) continue;
        const n = parseFloat(raw);
        if (Number.isFinite(n) && n >= 0) caps[cat] = n;
      }
      const { data: profile, error: fetchErr } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      const rawPrefs = (profile?.preferences ?? {}) as Record<string, unknown>;
      const mergedPrefs = mergePreferences(rawPrefs);
      const nextPlafonds: BudgetPlafondsMap = {
        ...mergedPrefs.budgetPlafonds,
        [selectedAccount]: caps,
      };
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: { ...rawPrefs, budgetPlafonds: nextPlafonds },
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      await refresh();
      setPlafondModalOpen(false);
    } catch (e) {
      setPlafondError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSavingPlafonds(false);
    }
  }, [isDemo, selectedAccount, preferences.categories, plafondDraft, refresh]);

  const emptyReal =
    !isDemo && !loadingTx && preferences.categories.length === 0;

  return (
    <div>
      <PageHeader
        title="Budget mensuel"
        description={
          isDemo
            ? 'Suivez vos enveloppes pour juin 2026 (données de démonstration).'
            : `Enveloppes et plafonds pour le mois en cours (${currentMonthLabelFr()}), par compte.`
        }
        actions={
          <div className={styles.actions}>
            <Link href={`${basePath}/settings`} className={`btn btn--secondary ${styles.settingsLink}`}>
              <Plus size={18} strokeWidth={2} />
              Catégories & comptes
            </Link>
          </div>
        }
      />

      <div className={`${styles.grid} ${compact ? styles.gridCompact : ''}`}>
        <Card>
          <div className={styles.overviewHead}>
            <h3 className={styles.overviewTitle}>Vue d’ensemble</h3>
            {!isDemo && preferences.accounts.length > 0 ? (
              <div className={styles.accountSelect}>
                <Select
                  id="budget-account"
                  label="Compte"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                >
                  {preferences.accounts.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
          </div>
          <div className={styles.pieWrap}>
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <PieChart>
                <Pie
                  data={budgetPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={96}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {budgetPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1f1f23',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.centerLabel}>
              <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                {pctUsed}%
              </span>
              <p className="text-caption" style={{ marginTop: '0.25rem' }}>
                du budget alloué
              </p>
            </div>
          </div>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCell}>
              <p>Dépensé</p>
              <p>{spentLabel}</p>
            </div>
            <div className={styles.summaryCell}>
              <p>Restant</p>
              <p>{remainingLabel}</p>
            </div>
          </div>
          {!isDemo && totalAllocated <= 0 && preferences.categories.length > 0 ? (
            <p className="text-caption" style={{ marginTop: 'var(--spacing-md)', marginBottom: 0 }}>
              Définissez des plafonds par catégorie pour ce compte (« Ajuster les plafonds »).
            </p>
          ) : null}
        </Card>

        <Card>
          <div className={styles.cardHead}>
            <h3>Détail par catégorie</h3>
            {!isDemo ? (
              <button
                type="button"
                className={styles.linkBtn}
                disabled={!selectedAccount || preferences.categories.length === 0}
                onClick={openPlafondModal}
              >
                Ajuster les plafonds
              </button>
            ) : null}
          </div>

          {emptyReal ? (
            <p className="text-caption" style={{ margin: 0 }}>
              Ajoutez des catégories dans les paramètres pour définir des enveloppes budgétaires.
            </p>
          ) : !isDemo && loadingTx ? (
            <p className="text-caption" style={{ margin: 0 }}>
              Chargement des transactions du mois…
            </p>
          ) : !isDemo && liveCategories.length === 0 ? (
            <p className="text-caption" style={{ margin: 0 }}>
              Aucune catégorie. Définissez-en dans les paramètres.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {liveCategories.map((cat) => {
                const progress = cat.total > 0 ? (cat.spent / cat.total) * 100 : 0;
                const isOver = cat.total > 0 && cat.spent > cat.total;
                const showBar = cat.total > 0;
                return (
                  <div key={cat.name} className={styles.catRow}>
                    <div className={styles.emoji}>
                      {cat.icon ?? <span className={styles.catInitial}>{cat.name.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div className={styles.catBody}>
                      <div className={styles.catHead}>
                        <span style={{ fontWeight: 600 }}>{cat.name}</span>
                        <span
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: isOver ? 'var(--color-danger)' : 'var(--color-text-primary)',
                          }}
                        >
                          {formatCurrency(cat.spent)}
                          {cat.total > 0 ? (
                            <>
                              {' '}
                              / {formatCurrency(cat.total)}
                            </>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                              {' '}
                              — plafond non défini
                            </span>
                          )}
                        </span>
                      </div>
                      {showBar ? (
                        <div className={styles.bar}>
                          <div
                            className={styles.barFill}
                            style={{
                              width: `${Math.min(progress, 100)}%`,
                              background: isOver ? 'var(--color-danger)' : cat.color,
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {!isDemo ? (
        <Modal
          title={selectedAccount ? `Plafonds mensuels — ${selectedAccount}` : 'Plafonds mensuels'}
          isOpen={plafondModalOpen}
          onClose={() => setPlafondModalOpen(false)}
          size="lg"
          footer={
            <div className={styles.modalFooter}>
              <button type="button" className={`btn btn--secondary ${styles.modalBtn}`} onClick={() => setPlafondModalOpen(false)}>
                Annuler
              </button>
              <button type="button" className={`btn btn--primary ${styles.modalBtn}`} disabled={savingPlafonds} onClick={savePlafonds}>
                {savingPlafonds ? <Loader2 size={18} className={styles.spin} /> : null}
                Enregistrer
              </button>
            </div>
          }
        >
          <p className="text-caption" style={{ marginBottom: 'var(--spacing-md)' }}>
            Montants maximums par catégorie pour <strong>{currentMonthLabelFr()}</strong>, sur le compte sélectionné.
            Les dépenses suivies proviennent de vos transactions du mois.
          </p>
          {plafondError ? (
            <p style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{plafondError}</p>
          ) : null}
          <div className={styles.plafondGrid}>
            {preferences.categories.map((cat) => (
              <Input
                key={cat}
                id={`plafond-${cat}`}
                label={cat}
                inputMode="decimal"
                placeholder="0"
                value={plafondDraft[cat] ?? ''}
                onChange={(e) =>
                  setPlafondDraft((d) => ({
                    ...d,
                    [cat]: e.target.value,
                  }))
                }
              />
            ))}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
