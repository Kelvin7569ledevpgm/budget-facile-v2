import React from 'react';
import { LayoutGrid, ArrowLeftRight, Settings } from 'lucide-react';
import styles from './LandingView.module.css';

export function MiniScreens() {
  return (
    <div className={styles.miniScreens}>
      {[
        { icon: LayoutGrid, title: 'Vue d’ensemble', lines: 4 },
        { icon: ArrowLeftRight, title: 'Transactions', lines: 5 },
        { icon: Settings, title: 'Paramètres', lines: 3 },
      ].map((s) => (
        <div key={s.title} className={styles.miniScreen}>
          <div className={styles.miniScreenHead}>
            <s.icon size={16} strokeWidth={2} aria-hidden />
            <span>{s.title}</span>
          </div>
          <div className={styles.miniScreenBody}>
            {Array.from({ length: s.lines }).map((_, i) => (
              <div key={i} className={styles.miniLine} style={{ width: `${85 - i * 12}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
