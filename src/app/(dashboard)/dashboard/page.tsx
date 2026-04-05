'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Plus,
  Activity,
  ArrowLeftRight,
  Wallet,
  BarChart3,
  Settings,
  Target,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useUserPreferences } from '@/contexts/UserPreferencesProvider';
import { formatSignedCurrencyAmount } from '@/lib/user-preferences';
import {
  chartLastSixMonths,
  deltaLastTwoWindows,
  expenseByCategory,
  sumPatrimoine,
  type TxMetric,
} from '@/lib/dashboard-metrics';
import styles from './DashboardPage.module.css';

const ACCENT = '#2dd4bf';
const MUTED_STROKE = 'rgba(161, 161, 170, 0.35)';

const DEMO_CHART_DATA = [
  { name: 'Jan', income: 4500, expense: 3200 },
  { name: 'Fév', income: 5200, expense: 3800 },
  { name: 'Mar', income: 4800, expense: 4100 },
  { name: 'Avr', income: 6100, expense: 4200 },
  { name: 'Mai', income: 5900, expense: 3900 },
  { name: 'Juin', income: 7200, expense: 4800 },
];

const DEMO_CATEGORIES = [
  { name: 'Technologie', val: 1290, max: 2000 },
  { name: 'Loisirs', val: 840, max: 2000 },
  { name: 'Alimentation', val: 620, max: 2000 },
];

const SHORTCUT_DEFS = [
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/dashboard/budget', label: 'Budget', icon: Wallet },
  { href: '/dashboard/goals', label: 'Objectifs', icon: Target },
  { href: '/dashboard/insights', label: 'Analyses', icon: BarChart3 },
  { href: '/settings', label: 'Paramètres', icon: Settings },
] as const;

type ActivityItem = { name: string; date: string; val: number; type: string };

const DEMO_ACTIVITY: ActivityItem[] = [
  { name: 'Apple Store', date: "Aujourd'hui", val: -1299, type: 'Technologie' },
  { name: 'Virement salaire', date: 'Hier', val: 4500, type: 'Revenus' },
  { name: 'Amazon Prime', date: '12 juin', val: -14.99, type: 'Abonnement' },
];

function formatActivityDayLabel(iso: string) {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - day.getTime()) / 86400000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function DashboardPage() {
  const { preferences, formatCurrency } = useUserPreferences();
  const compact = preferences.compact;
  const pathname = usePathname();
  const basePath = pathname.startsWith('/demo') ? '/demo' : '';
  const shortcuts = useMemo(
    () => SHORTCUT_DEFS.map((s) => ({ ...s, href: `${basePath}${s.href}` })),
    [basePath]
  );

  const isDemo = pathname.startsWith('/demo');
  const [userTxs, setUserTxs] = useState<TxMetric[]>([]);

  useEffect(() => {
    if (isDemo) {
      setUserTxs([]);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data } = await supabase
          .from('transactions')
          .select('label, category, date, amount, type')
          .eq('user_id', user.id)
          .order('date', { ascending: false });
        if (!cancelled) setUserTxs((data ?? []) as TxMetric[]);
      } catch {
        if (!cancelled) setUserTxs([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isDemo, pathname]);

  const activityPreview = useMemo((): ActivityItem[] => {
    if (isDemo) return DEMO_ACTIVITY;
    return userTxs
      .slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 3)
      .map((tx) => ({
        name: String(tx.label ?? '—'),
        type: String(tx.category ?? '—'),
        date: formatActivityDayLabel(String(tx.date)),
        val: Number(tx.amount),
      }));
  }, [isDemo, userTxs]);

  const chartRows = isDemo ? DEMO_CHART_DATA : chartLastSixMonths(userTxs);
  const categoryRows = isDemo ? DEMO_CATEGORIES : expenseByCategory(userTxs);
  const patrimoineVal = isDemo ? 142850.42 : sumPatrimoine(userTxs);

  function renderDeltaBlock() {
    if (isDemo) {
      return (
        <p className={styles.delta}>
          Variation sur 30 jours : <strong>+12,4 %</strong> par rapport au mois précédent.
        </p>
      );
    }
    if (userTxs.length === 0) {
      return (
        <p className={styles.delta}>
          Ajoutez des transactions pour suivre l’évolution de votre patrimoine.
        </p>
      );
    }
    const { last30, prev30 } = deltaLastTwoWindows(userTxs);
    if (last30 === 0 && prev30 === 0) {
      return <p className={styles.delta}>Aucune opération sur les 60 derniers jours.</p>;
    }
    if (prev30 === 0) {
      return (
        <p className={styles.delta}>
          Solde net sur 30 jours : <strong>{formatCurrency(last30)}</strong>.
        </p>
      );
    }
    const pct = ((last30 - prev30) / Math.abs(prev30)) * 100;
    return (
      <p className={styles.delta}>
        Variation sur 30 jours :{' '}
        <strong style={{ color: pct >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
          {pct >= 0 ? '+' : ''}
          {pct.toFixed(1)} %
        </strong>{' '}
        par rapport aux 30 jours précédents.
      </p>
    );
  }

  return (
    <div className={`${styles.wrap} ${compact ? styles.wrapCompact : ''}`}>
      <div className={styles.topRow}>
        <Card elevated className={styles.heroCard}>
          <div className={styles.heroMain}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden />
              Patrimoine estimé
            </div>
            <p className={styles.balance}>{formatCurrency(patrimoineVal)}</p>
            {renderDeltaBlock()}
          </div>
          <div className={styles.heroActions}>
            <Link href={`${basePath}/transactions`} className={`btn btn--secondary ${styles.heroActionBtn}`}>
              <Plus size={18} strokeWidth={2} />
              Nouvelle transaction
            </Link>
          </div>
        </Card>
      </div>

      <div className={styles.grid}>
        <div className={styles.mainCol}>
          <Card className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>Flux entrants et sortants</h2>
                <p className="text-caption" style={{ marginTop: '0.25rem' }}>
                  {isDemo
                    ? 'Agrégé sur six mois (données de démonstration)'
                    : 'Agrégé sur six mois à partir de vos transactions'}
                </p>
              </div>
              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: ACCENT }} />
                  Entrées
                </span>
                <span className={styles.legendItem}>
                  <span
                    className={styles.legendDot}
                    style={{ background: 'rgba(161, 161, 170, 0.5)' }}
                  />
                  Sorties
                </span>
              </div>
            </div>
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                <AreaChart data={chartRows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACCENT} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    dy={8}
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      background: '#1f1f23',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      fontSize: '13px',
                    }}
                    labelStyle={{ color: '#a1a1aa' }}
                    itemStyle={{ color: '#fafafa' }}
                    formatter={(value) => [formatCurrency(Number(value ?? 0)), '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke={ACCENT}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#dashIncome)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke={MUTED_STROKE}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className={styles.subGrid}>
            <Card>
              <h3 className={styles.sectionTitle}>Répartition des dépenses</h3>
              <div>
                {!isDemo && categoryRows.length === 0 ? (
                  <p className="text-caption" style={{ margin: 0 }}>
                    Aucune dépense enregistrée pour l’instant — les catégories apparaîtront ici.
                  </p>
                ) : (
                  categoryRows.map((item) => (
                    <div key={item.name} className={styles.catRow}>
                      <div className={styles.catMeta}>
                        <span className={styles.catName}>{item.name}</span>
                        <span className={styles.catVal}>{formatCurrency(item.val)}</span>
                      </div>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{
                            width: `${Math.min(100, (item.val / item.max) * 100)}%`,
                            background: ACCENT,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <div className={styles.insight}>
                <Activity size={20} style={{ color: ACCENT, marginBottom: '0.75rem' }} />
                <span className={styles.insightLabel}>Suggestion</span>
                <h3 className={styles.insightTitle}>{isDemo ? 'Abonnements' : 'Pour commencer'}</h3>
                <p className={styles.insightBody}>
                  {isDemo ? (
                    <>
                      D’après vos libellés récurrents, vous pourriez réallouer environ{' '}
                      <strong>240 €</strong> ce mois-ci en revoyant des abonnements peu utilisés.
                    </>
                  ) : userTxs.length === 0 ? (
                    'Les suggestions personnalisées apparaîtront lorsque vous aurez enregistré des transactions.'
                  ) : (
                    'Explorez vos catégories et l’historique pour ajuster vos habitudes de dépenses.'
                  )}
                </p>
              </div>
            </Card>
          </div>
        </div>

        <div className={styles.rightCol}>
          <Card className={styles.shortcutsCard}>
            <h3 className={styles.sectionTitle}>Raccourcis</h3>
            <div className={styles.quickGrid}>
              {shortcuts.map((item) => (
                <Link key={item.href} href={item.href} className={styles.quickBtn}>
                  <item.icon size={22} strokeWidth={1.8} aria-hidden />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card className={styles.activityCard}>
            <h3 className={styles.sectionTitle}>Activité récente</h3>
            <div className={styles.activityList}>
              {activityPreview.length === 0 ? (
                <p className="text-caption" style={{ margin: 0 }}>
                  Ajoutez des transactions pour voir l’activité récente ici.
                </p>
              ) : (
                activityPreview.map((tx) => (
                  <div key={`${tx.name}-${tx.date}-${tx.val}`} className={styles.activityRow}>
                    <div className={styles.activityLeft}>
                      <div className={styles.avatar}>{tx.name[0]}</div>
                      <div style={{ minWidth: 0 }}>
                        <p className={styles.activityName}>{tx.name}</p>
                        <p className={styles.activityMeta}>
                          {tx.type} · {tx.date}
                        </p>
                      </div>
                    </div>
                    <span
                      className={styles.amount}
                      style={{ color: tx.val > 0 ? 'var(--color-success)' : 'var(--color-text-primary)' }}
                    >
                      {formatSignedCurrencyAmount(tx.val, preferences)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <Link href={`${basePath}/transactions`} className={styles.historyBtn}>
              Voir toutes les transactions
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
