'use client';

import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { UserPreferencesProvider, useUserPreferences } from '@/contexts/UserPreferencesProvider';
import OnboardingWizard from '@/components/OnboardingWizard';
import styles from './DashboardShell.module.css';

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { preferences } = useUserPreferences();
  const compact = preferences.compact;

  return (
    <div className={styles.shell}>
      <OnboardingWizard />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className={styles.mainWrap}>
        <header className={styles.mobileBar}>
          <button
            type="button"
            className={styles.menuBtn}
            aria-expanded={mobileOpen}
            aria-controls="app-sidebar"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          <span className={styles.mobileTitle}>BudgetFacile</span>
        </header>
        <main className={`${styles.main} ${compact ? styles.mainCompact : ''}`}>
          <div className={`${styles.inner} ${compact ? styles.innerCompact : ''}`}>{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <UserPreferencesProvider>
      <DashboardShellInner>{children}</DashboardShellInner>
    </UserPreferencesProvider>
  );
}
