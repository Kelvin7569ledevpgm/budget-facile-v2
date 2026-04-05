'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  PiggyBank,
  CalendarDays,
  TrendingUp,
  CheckCircle2,
  Loader2,
  History,
} from 'lucide-react';
import { PageHeader, Card, Modal, Input, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useUserPreferences } from '@/contexts/UserPreferencesProvider';
import styles from './GoalsPage.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type SavingsGoal = {
  id: string;
  name: string;
  description: string;
  target_amount: number;
  saved_amount: number;
  target_date: string | null;
  color: string;
  emoji: string;
  created_at: string;
};

type Contribution = {
  id: string;
  goal_id: string;
  amount: number;
  note: string;
  date: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJI_OPTIONS = ['🎯', '✈️', '🏠', '🚗', '📱', '🎓', '💍', '🏖️', '🎮', '🐾', '🏋️', '🌍', '💰', '🎁', '🏄'];

const COLOR_OPTIONS = [
  '#2dd4bf', // teal (accent)
  '#a78bfa', // violet
  '#f87171', // red
  '#fbbf24', // amber
  '#34d399', // green
  '#60a5fa', // blue
  '#fb923c', // orange
  '#e879f9', // fuchsia
];

// ─── Demo data ─────────────────────────────────────────────────────────────

const DEMO_GOALS: SavingsGoal[] = [
  {
    id: 'demo-1',
    name: 'Voyage au Japon',
    description: 'Séjour de 3 semaines avec découverte de Tokyo, Kyoto et Osaka.',
    target_amount: 4500,
    saved_amount: 2700,
    target_date: '2026-12-01',
    color: '#2dd4bf',
    emoji: '✈️',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-2',
    name: 'Nouveau MacBook',
    description: 'Remplacement de mon ordinateur portable pour le travail.',
    target_amount: 2200,
    saved_amount: 2200,
    target_date: null,
    color: '#60a5fa',
    emoji: '💻',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'demo-3',
    name: 'Fonds d\'urgence',
    description: 'Épargne de précaution : 3 mois de dépenses courantes.',
    target_amount: 6000,
    saved_amount: 1800,
    target_date: '2027-06-01',
    color: '#34d399',
    emoji: '🏦',
    created_at: '2026-02-01T00:00:00Z',
  },
];

const DEMO_CONTRIBUTIONS: Contribution[] = [
  { id: 'dc-1', goal_id: 'demo-1', amount: 500, note: 'Prime de fin d\'année', date: '2026-01-15' },
  { id: 'dc-2', goal_id: 'demo-1', amount: 300, note: 'Virement mensuel', date: '2026-02-01' },
  { id: 'dc-3', goal_id: 'demo-1', amount: 400, note: 'Virement mensuel', date: '2026-03-01' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function monthsUntil(isoDate: string): number {
  const now = new Date();
  const target = new Date(isoDate + 'T12:00:00');
  return Math.max(
    0,
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()),
  );
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function monthLabel(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}

// ─── GoalCard ──────────────────────────────────────────────────────────────

type GoalCardProps = {
  goal: SavingsGoal;
  formatCurrency: (n: number) => string;
  isDemo: boolean;
  onEdit: (g: SavingsGoal) => void;
  onDelete: (id: string) => void;
  onAddContrib: (g: SavingsGoal) => void;
  onViewHistory: (g: SavingsGoal) => void;
};

function GoalCard({ goal, formatCurrency, isDemo, onEdit, onDelete, onAddContrib, onViewHistory }: GoalCardProps) {
  const pct = goal.target_amount > 0
    ? Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100))
    : 0;
  const remaining = Math.max(0, goal.target_amount - goal.saved_amount);
  const isCompleted = pct >= 100;

  const monthlyNeeded = useMemo(() => {
    if (!goal.target_date || isCompleted) return null;
    const months = monthsUntil(goal.target_date);
    if (months <= 0) return null;
    return remaining / months;
  }, [goal.target_date, isCompleted, remaining]);

  const isOverdue = goal.target_date && !isCompleted && monthsUntil(goal.target_date) === 0;

  return (
    <Card className={styles.goalCard}>
      {/* Header */}
      <div className={styles.goalCardTop}>
        <div className={styles.goalEmoji}>{goal.emoji}</div>
        <div className={styles.goalInfo}>
          <p className={styles.goalName}>{goal.name}</p>
          {goal.description && <p className={styles.goalDesc}>{goal.description}</p>}
        </div>
        <div className={styles.goalActions}>
          <button
            type="button"
            className={styles.iconBtn}
            title="Historique"
            onClick={() => onViewHistory(goal)}
          >
            <History size={14} />
          </button>
          {!isDemo && (
            <>
              <button
                type="button"
                className={styles.iconBtn}
                title="Modifier"
                onClick={() => onEdit(goal)}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.danger}`}
                title="Supprimer"
                onClick={() => onDelete(goal.id)}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className={styles.progressWrap}>
        <div className={styles.progressHeader}>
          <span className={styles.progressPct}>{pct}%</span>
          <span className={styles.progressAmounts}>
            {formatCurrency(goal.saved_amount)} / {formatCurrency(goal.target_amount)}
          </span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${pct}%`, background: isCompleted ? 'var(--color-success)' : goal.color }}
          />
        </div>
      </div>

      {/* Chips */}
      <div className={styles.metaRow}>
        {isCompleted ? (
          <span className={`${styles.metaChip} ${styles.success}`}>
            <CheckCircle2 size={12} />
            Objectif atteint !
          </span>
        ) : (
          <span className={styles.metaChip}>
            <PiggyBank size={12} />
            Reste {formatCurrency(remaining)}
          </span>
        )}

        {goal.target_date && !isCompleted && (
          <span className={`${styles.metaChip} ${isOverdue ? styles.warning : ''}`}>
            <CalendarDays size={12} />
            {isOverdue ? 'Échéance dépassée' : monthLabel(goal.target_date)}
          </span>
        )}

        {monthlyNeeded !== null && monthlyNeeded > 0 && (
          <span className={`${styles.metaChip} ${styles.accent}`}>
            <TrendingUp size={12} />
            {formatCurrency(monthlyNeeded)} / mois
          </span>
        )}
      </div>

      {/* Add contribution button */}
      {!isCompleted && (
        <button
          type="button"
          className={styles.addContribBtn}
          onClick={() => onAddContrib(goal)}
        >
          <Plus size={14} />
          Ajouter une contribution
        </button>
      )}
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const pathname = usePathname();
  const isDemo = pathname.startsWith('/demo');
  const { formatCurrency } = useUserPreferences();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // ── Goal modal ────────────────────────────────────────────────────────────
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState({
    name: '',
    description: '',
    target_amount: '',
    target_date: '',
    emoji: '🎯',
    color: '#2dd4bf',
  });
  const [goalError, setGoalError] = useState<string | null>(null);
  const [savingGoal, setSavingGoal] = useState(false);

  // ── Contribution modal ────────────────────────────────────────────────────
  const [contribModalOpen, setContribModalOpen] = useState(false);
  const [contribGoal, setContribGoal] = useState<SavingsGoal | null>(null);
  const [contribForm, setContribForm] = useState({ amount: '', note: '', date: new Date().toISOString().slice(0, 10) });
  const [contribError, setContribError] = useState<string | null>(null);
  const [savingContrib, setSavingContrib] = useState(false);

  // ── History modal ─────────────────────────────────────────────────────────
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyGoal, setHistoryGoal] = useState<SavingsGoal | null>(null);
  const [historyContribs, setHistoryContribs] = useState<Contribution[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadGoals = useCallback(async () => {
    if (isDemo) {
      setGoals(DEMO_GOALS);
      setContributions(DEMO_CONTRIBUTIONS);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      const { data } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setGoals((data ?? []) as SavingsGoal[]);
    } catch {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalTarget = useMemo(() => goals.reduce((s, g) => s + g.target_amount, 0), [goals]);
  const totalSaved = useMemo(() => goals.reduce((s, g) => s + g.saved_amount, 0), [goals]);
  const completedCount = useMemo(() => goals.filter((g) => g.saved_amount >= g.target_amount).length, [goals]);

  // ── Goal modal helpers ─────────────────────────────────────────────────────
  function openNewGoal() {
    setEditingGoalId(null);
    setGoalError(null);
    setGoalForm({ name: '', description: '', target_amount: '', target_date: '', emoji: '🎯', color: '#2dd4bf' });
    setGoalModalOpen(true);
  }

  function openEditGoal(g: SavingsGoal) {
    setEditingGoalId(g.id);
    setGoalError(null);
    setGoalForm({
      name: g.name,
      description: g.description ?? '',
      target_amount: String(g.target_amount),
      target_date: g.target_date ?? '',
      emoji: g.emoji,
      color: g.color,
    });
    setGoalModalOpen(true);
  }

  async function saveGoal() {
    const amt = parseFloat(goalForm.target_amount.replace(',', '.'));
    if (!goalForm.name.trim()) { setGoalError('Le nom est obligatoire.'); return; }
    if (!Number.isFinite(amt) || amt <= 0) { setGoalError('Entrez un montant cible valide.'); return; }

    if (isDemo) {
      if (editingGoalId) {
        setGoals((prev) => prev.map((g) =>
          g.id === editingGoalId
            ? { ...g, name: goalForm.name.trim(), description: goalForm.description.trim(), target_amount: amt, target_date: goalForm.target_date || null, emoji: goalForm.emoji, color: goalForm.color }
            : g
        ));
      } else {
        setGoals((prev) => [{
          id: `demo-${Date.now()}`, user_id: 'demo', name: goalForm.name.trim(), description: goalForm.description.trim(),
          target_amount: amt, saved_amount: 0, target_date: goalForm.target_date || null,
          color: goalForm.color, emoji: goalForm.emoji, created_at: new Date().toISOString(),
        }, ...prev]);
      }
      setGoalModalOpen(false);
      return;
    }

    setSavingGoal(true);
    setGoalError(null);
    try {
      const supabase = createClient();
      const payload = {
        name: goalForm.name.trim(),
        description: goalForm.description.trim() || null,
        target_amount: amt,
        target_date: goalForm.target_date || null,
        emoji: goalForm.emoji,
        color: goalForm.color,
        updated_at: new Date().toISOString(),
      };
      if (editingGoalId) {
        const { error } = await supabase.from('savings_goals').update(payload).eq('id', editingGoalId).eq('user_id', userId!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('savings_goals').insert({ ...payload, user_id: userId! });
        if (error) throw error;
      }
      await loadGoals();
      setGoalModalOpen(false);
    } catch (e) {
      setGoalError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSavingGoal(false);
    }
  }

  async function deleteGoal(id: string) {
    if (isDemo) { setGoals((prev) => prev.filter((g) => g.id !== id)); return; }
    try {
      const supabase = createClient();
      await supabase.from('savings_goals').delete().eq('id', id).eq('user_id', userId!);
      await loadGoals();
    } catch { /* silencieux */ }
  }

  // ── Contribution modal helpers ────────────────────────────────────────────
  function openAddContrib(g: SavingsGoal) {
    setContribGoal(g);
    setContribError(null);
    setContribForm({ amount: '', note: '', date: new Date().toISOString().slice(0, 10) });
    setContribModalOpen(true);
  }

  async function saveContrib() {
    const amt = parseFloat(contribForm.amount.replace(',', '.'));
    if (!Number.isFinite(amt) || amt <= 0) { setContribError('Entrez un montant valide.'); return; }
    if (!contribGoal) return;

    if (isDemo) {
      const newC: Contribution = { id: `dc-${Date.now()}`, goal_id: contribGoal.id, amount: amt, note: contribForm.note.trim(), date: contribForm.date };
      setContributions((prev) => [newC, ...prev]);
      setGoals((prev) => prev.map((g) => g.id === contribGoal.id ? { ...g, saved_amount: g.saved_amount + amt } : g));
      setContribModalOpen(false);
      return;
    }

    setSavingContrib(true);
    setContribError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('savings_contributions').insert({
        goal_id: contribGoal.id,
        user_id: userId!,
        amount: amt,
        note: contribForm.note.trim() || null,
        date: contribForm.date,
      });
      if (error) throw error;
      await loadGoals();
      setContribModalOpen(false);
    } catch (e) {
      setContribError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSavingContrib(false);
    }
  }

  // ── History modal helpers ─────────────────────────────────────────────────
  async function openHistory(g: SavingsGoal) {
    setHistoryGoal(g);
    setHistoryModalOpen(true);

    if (isDemo) {
      setHistoryContribs(contributions.filter((c) => c.goal_id === g.id));
      return;
    }

    setLoadingHistory(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('savings_contributions')
        .select('*')
        .eq('goal_id', g.id)
        .order('date', { ascending: false });
      setHistoryContribs((data ?? []) as Contribution[]);
    } catch {
      setHistoryContribs([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function deleteContrib(contribId: string, goalId: string) {
    if (isDemo) {
      const c = contributions.find((c) => c.id === contribId);
      if (!c) return;
      setContributions((prev) => prev.filter((x) => x.id !== contribId));
      setHistoryContribs((prev) => prev.filter((x) => x.id !== contribId));
      setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, saved_amount: Math.max(0, g.saved_amount - c.amount) } : g));
      return;
    }
    try {
      const supabase = createClient();
      await supabase.from('savings_contributions').delete().eq('id', contribId).eq('user_id', userId!);
      // The DB trigger will update saved_amount automatically
      setHistoryContribs((prev) => prev.filter((x) => x.id !== contribId));
      await loadGoals();
    } catch { /* silencieux */ }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <PageHeader
        title="Objectifs"
        description={
          isDemo
            ? "Suivez vos projets d'épargne (données de démonstration)."
            : "Créez des objectifs, versez des contributions et suivez votre progression."
        }
        actions={
          <button type="button" className={styles.btnAccent} onClick={openNewGoal}>
            <Plus size={16} strokeWidth={2} />
            Nouvel objectif
          </button>
        }
      />

      {/* ── Stats bar ── */}
      {goals.length > 0 && (
        <div className={styles.statsRow}>
          <Card className={styles.statCard}>
            <span className={styles.statLabel}>Épargne totale</span>
            <span className={styles.statValue}>{formatCurrency(totalSaved)}</span>
            <span className={styles.statSub}>sur {formatCurrency(totalTarget)} visés</span>
          </Card>
          <Card className={styles.statCard}>
            <span className={styles.statLabel}>Progression globale</span>
            <span className={styles.statValue}>
              {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%
            </span>
            <span className={styles.statSub}>{goals.length} objectif{goals.length > 1 ? 's' : ''} actif{goals.length > 1 ? 's' : ''}</span>
          </Card>
          <Card className={styles.statCard}>
            <span className={styles.statLabel}>Objectifs atteints</span>
            <span className={styles.statValue} style={{ color: completedCount > 0 ? 'var(--color-success)' : undefined }}>
              {completedCount}
            </span>
            <span className={styles.statSub}>sur {goals.length} au total</span>
          </Card>
        </div>
      )}

      {/* ── Goals grid ── */}
      {loading ? (
        <div className={styles.skeletonGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 220, borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
          ))}
        </div>
      ) : (
        <div className={styles.grid}>
          {goals.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🎯</span>
              <p className={styles.emptyTitle}>Aucun objectif pour l'instant</p>
              <p className={styles.emptyBody}>
                Créez votre premier objectif d'épargne — voyage, achat, fonds d'urgence — et suivez votre progression mois après mois.
              </p>
              <button type="button" className={styles.btnAccent} onClick={openNewGoal}>
                <Plus size={16} />
                Créer un objectif
              </button>
            </div>
          ) : (
            goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                formatCurrency={formatCurrency}
                isDemo={isDemo}
                onEdit={openEditGoal}
                onDelete={deleteGoal}
                onAddContrib={openAddContrib}
                onViewHistory={openHistory}
              />
            ))
          )}
        </div>
      )}

      {/* ── Goal modal (create / edit) ── */}
      <Modal
        title={editingGoalId ? "Modifier l'objectif" : 'Nouvel objectif'}
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="default" onClick={() => setGoalModalOpen(false)}>Annuler</Button>
            <button type="button" className={styles.btnAccent} onClick={saveGoal} disabled={savingGoal}>
              {savingGoal ? <Loader2 size={16} className="animate-spin" /> : null}
              {editingGoalId ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        }
      >
        {goalError && <p className={styles.modalError}>{goalError}</p>}

        {/* Emoji */}
        <div className={styles.formRow}>
          <span className={styles.formLabel}>Icône</span>
          <div className={styles.emojiPicker}>
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                className={`${styles.emojiOption} ${goalForm.emoji === e ? styles.selected : ''}`}
                onClick={() => setGoalForm((f) => ({ ...f, emoji: e }))}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className={styles.formRow}>
          <span className={styles.formLabel}>Couleur</span>
          <div className={styles.colorPicker}>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.colorSwatch} ${goalForm.color === c ? styles.selected : ''}`}
                style={{ background: c }}
                onClick={() => setGoalForm((f) => ({ ...f, color: c }))}
              />
            ))}
          </div>
        </div>

        <Input
          id="goal-name"
          label="Nom de l'objectif"
          placeholder="Ex : Voyage au Japon"
          value={goalForm.name}
          onChange={(e) => setGoalForm((f) => ({ ...f, name: e.target.value }))}
        />

        <Input
          id="goal-desc"
          label="Description (optionnel)"
          placeholder="Quelques mots sur ce projet…"
          value={goalForm.description}
          onChange={(e) => setGoalForm((f) => ({ ...f, description: e.target.value }))}
        />

        <Input
          id="goal-amount"
          label="Montant cible (€)"
          placeholder="Ex : 3 000"
          value={goalForm.target_amount}
          onChange={(e) => setGoalForm((f) => ({ ...f, target_amount: e.target.value }))}
          type="text"
          inputMode="decimal"
        />

        <Input
          id="goal-date"
          label="Date cible (optionnel)"
          type="date"
          value={goalForm.target_date}
          onChange={(e) => setGoalForm((f) => ({ ...f, target_date: e.target.value }))}
        />
        <p className={styles.formHint}>Si vous fixez une date, on calculera combien épargner chaque mois.</p>
      </Modal>

      {/* ── Contribution modal ── */}
      <Modal
        title={`Ajouter une contribution — ${contribGoal?.name ?? ''}`}
        isOpen={contribModalOpen}
        onClose={() => setContribModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="default" onClick={() => setContribModalOpen(false)}>Annuler</Button>
            <button type="button" className={styles.btnAccent} onClick={saveContrib} disabled={savingContrib}>
              {savingContrib ? <Loader2 size={16} className="animate-spin" /> : null}
              Ajouter
            </button>
          </div>
        }
      >
        {contribError && <p className={styles.modalError}>{contribError}</p>}

        {contribGoal && (
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}>
            Épargne actuelle : <strong style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(contribGoal.saved_amount)}</strong>{' '}
            sur {formatCurrency(contribGoal.target_amount)}
          </p>
        )}

        <Input
          id="contrib-amount"
          label="Montant versé (€)"
          placeholder="Ex : 200"
          value={contribForm.amount}
          onChange={(e) => setContribForm((f) => ({ ...f, amount: e.target.value }))}
          type="text"
          inputMode="decimal"
        />

        <Input
          id="contrib-note"
          label="Note (optionnel)"
          placeholder="Ex : Virement mensuel, prime…"
          value={contribForm.note}
          onChange={(e) => setContribForm((f) => ({ ...f, note: e.target.value }))}
        />

        <Input
          id="contrib-date"
          label="Date"
          type="date"
          value={contribForm.date}
          onChange={(e) => setContribForm((f) => ({ ...f, date: e.target.value }))}
        />
      </Modal>

      {/* ── History modal ── */}
      <Modal
        title={`Historique — ${historyGoal?.name ?? ''}`}
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      >
        {loadingHistory ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Chargement…</p>
        ) : historyContribs.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Aucune contribution enregistrée pour cet objectif.
          </p>
        ) : (
          <div className={styles.contribList}>
            {historyContribs.map((c) => (
              <div key={c.id} className={styles.contribRow}>
                <div className={styles.contribMeta}>
                  <span className={styles.contribNote}>{c.note || 'Contribution'}</span>
                  <span className={styles.contribDate}>{formatDate(c.date)}</span>
                </div>
                <span className={styles.contribAmount}>+{formatCurrency(c.amount)}</span>
                {!isDemo && (
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.danger}`}
                    title="Supprimer"
                    onClick={() => deleteContrib(c.id, c.goal_id)}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
