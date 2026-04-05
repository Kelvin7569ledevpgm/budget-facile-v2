import React from 'react';
import DashboardShell from '@/components/DashboardShell';
import { DemoBanner } from '@/components/DemoBanner';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <>
        <DemoBanner />
        {children}
      </>
    </DashboardShell>
  );
}
