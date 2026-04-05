/** Bornes du mois civil courant (dates ISO YYYY-MM-DD, fuseau local). */
export function currentMonthBounds(): { from: string; to: string } {
  const n = new Date();
  const y = n.getFullYear();
  const m = n.getMonth();
  const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const last = new Date(y, m + 1, 0).getDate();
  const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
  return { from, to };
}

export function currentMonthLabelFr(): string {
  return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export type TxSlice = {
  category: string;
  amount: number;
  type: string;
  account: string;
  date: string;
};

/** Somme des dépenses (type expense) par catégorie pour un compte et une période. */
export function spentByCategoryForAccount(
  rows: TxSlice[],
  account: string,
  from: string,
  to: string
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const t of rows) {
    if (t.account !== account) continue;
    const d = String(t.date).slice(0, 10);
    if (d < from || d > to) continue;
    if (t.type !== 'expense') continue;
    const c = t.category?.trim() || 'Autre';
    map[c] = (map[c] || 0) + Math.abs(Number(t.amount));
  }
  return map;
}
