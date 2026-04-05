'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  BarChart3,
  LayoutGrid,
  Wallet,
  ArrowLeftRight,
  Settings,
  HelpCircle,
  LogOut,
  ShieldCheck,
  Target,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const menuItems = [
  { icon: LayoutGrid, label: "Vue d'ensemble", href: '/dashboard' },
  { icon: ArrowLeftRight, label: 'Transactions', href: '/transactions' },
  { icon: Wallet, label: 'Budget', href: '/dashboard/budget' },
  { icon: Target, label: 'Objectifs', href: '/dashboard/goals' },
  { icon: BarChart3, label: 'Analyses', href: '/dashboard/insights' },
  { icon: Settings, label: 'Paramètres', href: '/settings' },
] as const;

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

/** Chemin logique sans préfixe /demo */
function appPath(pathname: string) {
  if (pathname === '/demo' || pathname.startsWith('/demo/')) {
    return pathname.slice(5) || '/';
  }
  return pathname;
}

function isActivePath(pathname: string, href: string) {
  const p = appPath(pathname);
  if (href === '/dashboard') {
    return p === '/dashboard';
  }
  return p === href || p.startsWith(`${href}/`);
}

const Sidebar = ({ mobileOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const isDemo = pathname.startsWith('/demo');
  const hrefPrefix = isDemo ? '/demo' : '';

  async function handleLogout() {
    onClose();
    if (isDemo) {
      router.push('/');
      router.refresh();
      return;
    }
    try {
      await createClient().auth.signOut();
    } catch {
      /* Supabase non configuré : on redirige quand même */
    }
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.backdrop} ${mobileOpen ? styles.backdropVisible : ''}`}
        aria-label="Fermer le menu"
        aria-hidden={!mobileOpen}
        tabIndex={mobileOpen ? 0 : -1}
        onClick={onClose}
      />
      <aside
        id="app-sidebar"
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}
        aria-label="Navigation principale"
      >
        <div className={styles.logo}>
          <ShieldCheck size={26} strokeWidth={2.2} className={styles.logoIcon} />
          <span className={styles.sidebarLabel}>BudgetFacile</span>
        </div>

        <nav className={styles.navMenu}>
          {menuItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={`${hrefPrefix}${item.href}`}
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                onClick={onClose}
              >
                <item.icon size={20} strokeWidth={2} />
                <span className={styles.sidebarLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <Link href={`${hrefPrefix}/support`} className={styles.navItem} onClick={onClose}>
            <HelpCircle size={20} strokeWidth={2} />
            <span className={styles.sidebarLabel}>Support</span>
          </Link>
          <button type="button" className={`${styles.navItem} ${styles.navItemButton}`} onClick={handleLogout}>
            <LogOut size={20} strokeWidth={2} />
            <span className={styles.sidebarLabel}>{isDemo ? 'Quitter la démo' : 'Déconnexion'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
