'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  mergePreferences,
  formatCurrencyAmount,
  type MergedUserPreferences,
} from '@/lib/user-preferences';

type Ctx = {
  preferences: MergedUserPreferences;
  loading: boolean;
  refresh: () => Promise<void>;
  formatCurrency: (n: number) => string;
};

const defaultMerged = mergePreferences({});

const UserPreferencesContext = createContext<Ctx | null>(null);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDemo = pathname.startsWith('/demo');
  const [raw, setRaw] = useState<unknown>({});
  const [loading, setLoading] = useState(!isDemo);

  const load = useCallback(async () => {
    if (isDemo) {
      setRaw({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setRaw({});
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences, onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();
      setRaw({
        ...(profile?.preferences ?? {}),
        onboardingCompleted: !!profile?.onboarding_completed,
      });
    } catch {
      setRaw({});
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    load();
  }, [load]);

  const preferences = useMemo(() => mergePreferences(raw), [raw]);

  const formatCurrency = useCallback(
    (n: number) => formatCurrencyAmount(n, preferences),
    [preferences]
  );

  const value = useMemo(
    () => ({ preferences, loading, refresh: load, formatCurrency }),
    [preferences, loading, load, formatCurrency]
  );

  return (
    <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>
  );
}

export function useUserPreferences(): Ctx {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) {
    return {
      preferences: defaultMerged,
      loading: false,
      refresh: async () => {},
      formatCurrency: (n: number) => formatCurrencyAmount(n, defaultMerged),
    };
  }
  return ctx;
}
