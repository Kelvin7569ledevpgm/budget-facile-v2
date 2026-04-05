'use client';

import React from 'react';
import { MessageCircle, Mail, ChevronRight } from 'lucide-react';
import { PageHeader, Card, Button } from '@/components/ui';
import styles from './SupportPage.module.css';

export default function SupportPage() {
  return (
    <div>
      <PageHeader
        title="Support"
        description="Réponses rapides et contact équipe (démo)."
      />

      <div className={styles.grid}>
        <Card>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--spacing-md)' }}>
            Questions fréquentes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              'Comment connecter mon compte bancaire ?',
              'Mes données sont-elles chiffrées ?',
              'Comment créer un budget par catégorie ?',
              'Comment exporter mes transactions en CSV ?',
            ].map((q, i) => (
              <div key={i} className={styles.faqItem} role="button" tabIndex={0}>
                <span>{q}</span>
                <ChevronRight size={18} className="text-muted" />
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div className={styles.chatCard}>
            <div className={styles.chatIcon}>
              <MessageCircle size={26} strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.5rem' }}>Chat</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              File d’attente simulée — idéal pour une future intégration.
            </p>
            <Button variant="default" type="button" style={{ width: '100%' }}>
              Démarrer
            </Button>
          </div>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <Mail size={20} style={{ color: 'var(--color-accent)' }} />
              <h4 style={{ fontWeight: 700 }}>Contact</h4>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Pour un cas complexe :{' '}
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>support@budgetfacile.com</span>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
