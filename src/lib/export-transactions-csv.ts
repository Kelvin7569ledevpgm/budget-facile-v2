export type CsvTransaction = {
  label: string;
  category: string;
  date: string;
  amount: number | string;
  type: string;
  account: string;
  status: string;
};

export function downloadTransactionsCsv(rows: CsvTransaction[], filenamePrefix = 'transactions-budgetfacile') {
  const header = ['Libellé', 'Catégorie', 'Date', 'Montant', 'Type', 'Compte', 'Statut'];
  const lines = rows.map((r) =>
    [
      `"${String(r.label).replace(/"/g, '""')}"`,
      r.category,
      r.date,
      r.amount,
      r.type,
      `"${String(r.account).replace(/"/g, '""')}"`,
      r.status,
    ].join(',')
  );
  const csv = [header.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
