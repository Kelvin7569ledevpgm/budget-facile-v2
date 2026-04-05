'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, Lightbulb } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useUserPreferences } from '@/contexts/UserPreferencesProvider';
import {
  expenseByCategory,
  patrimoineSeriesLastSixMonths,
  sumPatrimoine,
  variationFirstLastPct,
  type TxMetric,
} from '@/lib/dashboard-metrics';
import styles from './InsightsPage.module.css';

const ACCENT = '#2dd4bf';

const DEMO_PERFORMANCE = [
  { month: 'Jan', value: 45000 },
  { month: 'Fév', value: 48000 },
  { month: 'Mar', value: 47000 },
  { month: 'Avr', value: 52000 },
  { month: 'Mai', value: 58000 },
  { month: 'Juin', value: 64000 },
];

const DEMO_TIPS = [
  'Les abonnements récurrents représentent une part stable de vos sorties : un passage en revue peut libérer du budget.',
  'La catégorie Restauration augmente par rapport au mois précédent.',
  'Une épargne automatique modeste renforcerait votre coussin sans changer vos habitudes.',
];

function buildTips(txs: TxMetric[], formatMoney: (n: number) => string): string[] {
  if (txs.length === 0) return [];
  const tips: string[] = [];
  const pat = sumPatrimoine(txs);
  if (pat < 0) {
    tips.push(
      'Votre patrimoine estimé (somme des opérations) est négatif : veillez à équilibrer revenus et dépenses.'
    );
  }
  const top = expenseByCategory(txs, 1)[0];
  if (top) {
    tips.push(
      `La catégorie « ${top.name} » représente ${formatMoney(top.val)} de dépenses — un bon point pour prioriser vos économies.`
    );
  }
  if (tips.length < 3) {
    tips.push('Affinez catégories et libellés pour des analyses plus précises au fil du temps.');
  }
  return tips.slice(0, 3);
}

export default function InsightsPage() {
  const { preferences, formatCurrency } = useUserPreferences();
  const compact = preferences.compact;
  const pathname = usePathname();
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

  const performanceData = useMemo(
    () => (isDemo ? DEMO_PERFORMANCE : patrimoineSeriesLastSixMonths(userTxs)),
    [isDemo, userTxs]
  );

  const variationPct = useMemo(() => {
    if (isDemo) return 14.2;
    return variationFirstLastPct(performanceData);
  }, [isDemo, performanceData]);

  const tips = useMemo(
    () => (isDemo ? DEMO_TIPS : buildTips(userTxs, formatCurrency)),
    [isDemo, userTxs, formatCurrency]
  );

  const maxVal = Math.max(...performanceData.map((d) => d.value), 0);
  const yDomain: [number, number] | [string, string] =
    maxVal === 0 ? [0, 1] : ['dataMin - 1', 'dataMax + 1'];

  const patrimoineActuel = sumPatrimoine(userTxs);
  const confidenceWidth = isDemo ? 85 : userTxs.length === 0 ? 0 : Math.min(35, 10 + userTxs.length * 2);

  return (
    <div>
      <PageHeader
        title="Analyses"
        description={
          isDemo
            ? 'Tendances et projections (données de démonstration).'
            : 'Tendances basées sur vos transactions — tout part de zéro pour un nouveau compte.'
        }
      />

      <div className={`${styles.grid} ${compact ? styles.gridCompact : ''}`}>
        <Card>
          <div className={styles.cardTop}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Évolution du patrimoine</h2>
              <p className="text-caption" style={{ marginTop: '0.25rem' }}>
                Six derniers mois
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {isDemo ? (
                <>
                  <p style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '1.125rem' }}>+14,2 %</p>
                  <p className="text-caption">sur 12 mois</p>
                </>
              ) : variationPct === null ? (
                <>
                  <p style={{ color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '1.125rem' }}>—</p>
                  <p className="text-caption">Évolution sur 6 mois (pas encore calculable)</p>
                </>
              ) : (
                <>
                  <p
                    style={{
                      color: variationPct >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                      fontWeight: 700,
                      fontSize: '1.125rem',
                    }}
                  >
                    {variationPct >= 0 ? '+' : ''}
                    {variationPct.toFixed(1).replace('.', ',')} %
                  </p>
                  <p className="text-caption">sur 6 mois (premier vs dernier mois)</p>
                </>
              )}
            </div>
          </div>

          <div className={styles.chartBox}>
            <ResponsiveContainer width="100%" height="100%" minHeight={260}>
              <AreaChart data={performanceData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="insValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  dy={8}
                />
                <YAxis hide domain={yDomain} />
                <Tooltip
                  contentStyle={{
                    background: '#1f1f23',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                  }}
                  formatter={(v) => [formatCurrency(Number(v ?? 0)), 'Patrimoine']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={ACCENT}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#insValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 'var(--spacing-md)' }}>
              <TrendingUp size={22} style={{ color: 'var(--color-success)' }} strokeWidth={2} />
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Projection</h2>
            </div>
            {isDemo ? (
              <>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                  Sur la base de vos flux récents, un scénario prudent placerait le patrimoine affiché autour de{' '}
                  <strong style={{ color: 'var(--color-text-primary)' }}>72 400 €</strong> fin de trimestre.
                </p>
                <div className={styles.prediction}>
                  <p className={styles.predictionLabel}>Niveau de confiance (illustratif)</p>
                  <div className={styles.confidenceBar}>
                    <div className={styles.confidenceTrack}>
                      <div className={styles.confidenceFill} style={{ width: '85%' }} />
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>85 %</span>
                  </div>
                </div>
              </>
            ) : userTxs.length === 0 ? (
              <>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                  Les projections et niveaux de confiance s’affineront lorsque vous aurez enregistré des transactions.
                </p>
                <div className={styles.prediction}>
                  <p className={styles.predictionLabel}>Niveau de confiance</p>
                  <div className={styles.confidenceBar}>
                    <div className={styles.confidenceTrack}>
                      <div className={styles.confidenceFill} style={{ width: '0%' }} />
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>0 %</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                  Patrimoine actuel (somme des opérations) :{' '}
                  <strong style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(patrimoineActuel)}</strong>.
                  Les projections automatiques gagneront en précision avec plus d’historique.
                </p>
                <div className={styles.prediction}>
                  <p className={styles.predictionLabel}>Indicateur de confiance (historique limité)</p>
                  <div className={styles.confidenceBar}>
                    <div className={styles.confidenceTrack}>
                      <div className={styles.confidenceFill} style={{ width: `${confidenceWidth}%` }} />
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{confidenceWidth} %</span>
                  </div>
                </div>
              </>
            )}
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 'var(--spacing-md)' }}>
              <Lightbulb size={22} style={{ color: 'var(--color-accent)' }} strokeWidth={2} />
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Pistes</h2>
            </div>
            <ul className={styles.tips}>
              {(isDemo ? DEMO_TIPS : tips.length > 0 ? tips : ['Ajoutez des transactions pour obtenir des pistes personnalisées.']).map(
                (tip, i) => (
                  <li key={i} className={styles.tip}>
                    <span className={styles.tipDot} />
                    {tip}
                  </li>
                )
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
