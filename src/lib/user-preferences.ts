/** Plafonds budgétaires mensuels : compte → catégorie → montant (≥ 0). */
export type BudgetPlafondsMap = Record<string, Record<string, number>>;

export type UserPreferences = {
  compact?: boolean;
  showCents?: boolean;
  currency?: string;
  locale?: string;
  categories?: string[];
  /** Comptes / moyens de paiement (Livret A, CCP, etc.) */
  accounts?: string[];
  budgetPlafonds?: BudgetPlafondsMap;
  /** Courte présentation affichée sur le profil (paramètres). */
  bio?: string;
  onboardingCompleted?: boolean;
};

const DEFAULT_CATEGORIES = ['Logement', 'Alimentation', 'Transport', 'Loisirs'];
const DEFAULT_ACCOUNTS = ['Compte principal', 'Livret A', 'Carte Visa', 'Pro'];

export type MergedUserPreferences = {
  compact: boolean;
  showCents: boolean;
  currency: string;
  locale: string;
  categories: string[];
  accounts: string[];
  budgetPlafonds: BudgetPlafondsMap;
  bio: string;
  onboardingCompleted: boolean;
};

function normalizeBudgetPlafonds(raw: unknown): BudgetPlafondsMap {
  if (!raw || typeof raw !== 'object') return {};
  const out: BudgetPlafondsMap = {};
  for (const [acc, cats] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof acc !== 'string' || !cats || typeof cats !== 'object' || cats === null) continue;
    out[acc] = {};
    for (const [cat, val] of Object.entries(cats as Record<string, unknown>)) {
      const n = typeof val === 'number' ? val : parseFloat(String(val));
      if (!Number.isFinite(n) || n < 0) continue;
      out[acc][cat] = n;
    }
    if (Object.keys(out[acc]).length === 0) delete out[acc];
  }
  return out;
}

export function mergePreferences(raw: unknown): MergedUserPreferences {
  const p = (raw && typeof raw === 'object' ? raw : {}) as UserPreferences;
  return {
    compact: Boolean(p.compact),
    showCents: p.showCents !== false,
    currency: typeof p.currency === 'string' ? p.currency : 'EUR',
    locale: typeof p.locale === 'string' ? p.locale : 'fr-FR',
    categories: Array.isArray(p.categories) && p.categories.length > 0 ? p.categories.map(String) : [...DEFAULT_CATEGORIES],
    accounts: Array.isArray(p.accounts) && p.accounts.length > 0 ? p.accounts.map(String) : [...DEFAULT_ACCOUNTS],
    budgetPlafonds: normalizeBudgetPlafonds(p.budgetPlafonds),
    bio: typeof p.bio === 'string' ? p.bio.slice(0, 500) : '',
    onboardingCompleted: !!p.onboardingCompleted,
  };
}

/** Montant formaté selon devise, locale et affichage des centimes (Intl). */
export function formatCurrencyAmount(n: number, p: MergedUserPreferences): string {
  const digits = p.showCents ? 2 : 0;
  try {
    return new Intl.NumberFormat(p.locale, {
      style: 'currency',
      currency: p.currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(n);
  } catch {
    return `${n.toLocaleString(p.locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })} €`;
  }
}

/** Pour les transactions : « + » explicite sur les montants positifs (Intl n’en ajoute pas). */
export function formatSignedCurrencyAmount(n: number, p: MergedUserPreferences): string {
  if (n > 0) return `+${formatCurrencyAmount(n, p)}`;
  return formatCurrencyAmount(n, p);
}
