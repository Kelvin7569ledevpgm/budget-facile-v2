export type TxMetric = {
  amount: number;
  date: string;
  category: string;
  type: string;
  label?: string | null;
};

const monthKey = (iso: string) => {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00');
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Patrimoine estimé = somme des montants (revenus +, dépenses −) */
export function sumPatrimoine(txs: TxMetric[]) {
  return txs.reduce((s, t) => s + Number(t.amount), 0);
}

export function formatEuro(n: number) {
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** 6 derniers mois calendaires (libellé court FR + entrées / sorties) */
export function chartLastSixMonths(txs: TxMetric[]) {
  const now = new Date();
  const rows: { name: string; income: number; expense: number; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const raw = d.toLocaleDateString('fr-FR', { month: 'short' });
    const name = raw.charAt(0).toUpperCase() + raw.slice(1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    rows.push({ name, income: 0, expense: 0, key });
  }

  txs.forEach((tx) => {
    const k = monthKey(tx.date);
    const row = rows.find((r) => r.key === k);
    if (!row) return;
    const amt = Number(tx.amount);
    if (amt >= 0) row.income += amt;
    else row.expense += Math.abs(amt);
  });

  return rows.map(({ name, income, expense }) => ({ name, income, expense }));
}

/** Dépenses par catégorie (montants positifs = ce qui a été dépensé) */
export function expenseByCategory(txs: TxMetric[], limit = 5) {
  const map = new Map<string, number>();
  txs.forEach((tx) => {
    const amt = Number(tx.amount);
    if (amt >= 0) return;
    const c = tx.category?.trim() || 'Autre';
    map.set(c, (map.get(c) || 0) + Math.abs(amt));
  });
  const list = [...map.entries()]
    .map(([name, val]) => ({ name, val }))
    .sort((a, b) => b.val - a.val);
  // Utiliser le max global pour que les barres soient proportionnelles entre elles
  const globalMax = list.length > 0 ? Math.max(...list.map((i) => i.val), 1) : 1;
  return list.slice(0, limit).map((item) => ({ ...item, max: globalMax }));
}

/** Sommes sur les 30 derniers jours vs les 30 jours précédents */
export function deltaLastTwoWindows(txs: TxMetric[]) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const t30 = new Date(today);
  t30.setDate(t30.getDate() - 30);
  const t60 = new Date(today);
  t60.setDate(t60.getDate() - 60);

  let last30 = 0;
  let prev30 = 0;

  txs.forEach((tx) => {
    const d = new Date(tx.date.slice(0, 10) + 'T12:00:00');
    const amt = Number(tx.amount);
    if (d > t30 && d <= today) last30 += amt;
    if (d > t60 && d <= t30) prev30 += amt;
  });

  return { last30, prev30 };
}

/**
 * Patrimoine cumulé en fin de chacun des 6 derniers mois (somme des transactions à cette date).
 */
export function patrimoineSeriesLastSixMonths(txs: TxMetric[]) {
  const now = new Date();
  const rows: { month: string; value: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = ref.getFullYear();
    const month = ref.getMonth();
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const raw = ref.toLocaleDateString('fr-FR', { month: 'short' });
    const monthLabel = raw.charAt(0).toUpperCase() + raw.slice(1);

    let cum = 0;
    txs.forEach((tx) => {
      const d = new Date(tx.date.slice(0, 10) + 'T12:00:00');
      if (d <= monthEnd) cum += Number(tx.amount);
    });
    rows.push({ month: monthLabel, value: cum });
  }

  return rows;
}

/** Variation en % entre première et dernière valeur de la série (6 mois) */
export function variationFirstLastPct(series: { value: number }[]): number | null {
  if (series.length < 2) return null;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  if (first === 0 && last === 0) return null;
  if (first === 0) return null;
  return ((last - first) / Math.abs(first)) * 100;
}
