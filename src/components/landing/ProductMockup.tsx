import React from 'react';
import styles from './LandingView.module.css';

const barHeights = ['45%', '62%', '38%', '71%', '55%', '80%', '48%'];

export function ProductMockup() {
  return (
    <div className={styles.mockWrap}>
      <div className={styles.mockTop}>
        <div className={styles.mockDots} aria-hidden>
          <span className={styles.mockDot} />
          <span className={styles.mockDot} />
          <span className={styles.mockDot} />
        </div>
        <span className={styles.mockTitle}>BudgetFacile</span>
      </div>
      <div className={styles.mockBody}>
        <div className={styles.mockRail} aria-hidden>
          <div className={`${styles.mockNavIcon} ${styles.active}`} />
          <div className={styles.mockNavIcon} />
          <div className={styles.mockNavIcon} />
          <div className={styles.mockNavIcon} />
        </div>
        <div className={styles.mockMain}>
          <div className={styles.mockKpi}>
            <div className={styles.mockKpiLabel}>Patrimoine estimé</div>
            <div className={styles.mockKpiValue}>142 850 €</div>
            <div className={styles.mockKpiDelta}>+12,4 % sur 30 jours</div>
          </div>
          <div className={styles.mockChart} aria-hidden>
            {barHeights.map((h, i) => (
              <div key={i} className={styles.mockBar} style={{ height: h }} />
            ))}
          </div>
          <div className={styles.mockRow}>
            <div className={styles.mockMini}>
              Flux du mois
              <strong>+2 340 €</strong>
            </div>
            <div className={styles.mockMini}>
              Budget respecté
              <strong>94 %</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
