'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from './HeroFlipWords.module.css';

export type HeroFlipWordsProps = {
  words: string[];
  intervalMs?: number;
  className?: string;
};

/**
 * Bandeau type « flip board » pour le hero : pas de Tailwind dans les cellules,
 * glyphes garantis visibles (contourne les soucis du composant Aceternity + grille).
 */
export function HeroFlipWords({ words, intervalMs = 3500, className }: HeroFlipWordsProps) {
  const [index, setIndex] = useState(0);

  const maxLen = useMemo(
    () => (words.length ? Math.max(...words.map((w) => w.length)) : 0),
    [words],
  );

  const padded = useMemo(() => {
    const w = (words[index] ?? words[0] ?? '').toUpperCase();
    return w.padEnd(maxLen, ' ');
  }, [words, index, maxLen]);

  useEffect(() => {
    if (words.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [words.length, intervalMs]);

  const chars = padded.split('');

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')} aria-hidden="true">
      <div className={styles.row} key={index}>
        {chars.map((ch, i) => (
          <span
            key={`${index}-${i}`}
            className={styles.cell}
            style={{ '--stagger': i } as React.CSSProperties}
          >
            <span className={styles.char}>{ch === ' ' ? '\u00a0' : ch}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
