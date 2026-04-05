import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import styles from './DemoBanner.module.css';

export function DemoBanner() {
  return (
    <div className={styles.banner} role="status">
      <Sparkles size={16} strokeWidth={2} aria-hidden className={styles.icon} />
      <p>
        <strong>Mode démonstration</strong> — données d’exemple.{' '}
        <Link href="/signup" className={styles.link}>
          Créer un compte
        </Link>{' '}
        pour enregistrer vos vraies données sur tous vos appareils.
      </p>
    </div>
  );
}
