'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './LandingView.module.css';

type FAQItemProps = {
  question: string;
  answer: string;
};

export function FAQItem({ question, answer }: FAQItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.faqItem}>
      <button type="button" className={styles.faqBtn} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {question}
        <ChevronDown size={18} className={`${styles.faqIcon} ${open ? styles.faqIconOpen : ''}`} aria-hidden />
      </button>
      {open ? (
        <div className={styles.faqPanel} data-open={open}>
          {answer}
        </div>
      ) : null}
    </div>
  );
}
