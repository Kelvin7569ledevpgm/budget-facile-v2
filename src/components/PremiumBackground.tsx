'use client';

import React, { useEffect, useState } from 'react';
import { ShootingStars } from '@/components/ui/shooting-stars';
import { StarsBackground } from '@/components/ui/stars-background';
import { cn } from '@/lib/utils';

const BASE_DENSITY = 0.000105;
const MOBILE_MAX_WIDTH = 768;

export type PremiumBackgroundProps = {
  /** Active le fond animé (étoiles + traînées). */
  enabled?: boolean;
  /** Multiplicateur de densité des étoiles (0–1+). */
  density?: number;
  /** Multiplicateur de « vitesse » perçue (scintillement, étoiles filantes). */
  speed?: number;
  /** Force visuelle du calque étoiles (0–1). */
  opacity?: number;
  /** Opacité du voile assombrissant pour la lisibilité (0–1). */
  overlayOpacity?: number;
  className?: string;
};

function useIsMobile() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return mobile;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return reduced;
}

export function PremiumBackground({
  enabled = true,
  density = 1,
  speed = 0.45,
  opacity = 0.72,
  overlayOpacity = 0.16,
  className,
}: PremiumBackgroundProps) {
  const isMobile = useIsMobile();
  const reducedMotion = usePrefersReducedMotion();

  if (!enabled) {
    return null;
  }

  const densityFactor = isMobile ? density * 0.58 : density;
  const starDensity = BASE_DENSITY * Math.max(0.15, densityFactor);

  const twinkleSlow = 1 / Math.max(0.35, speed);
  const minTwinkle = 2.2 * twinkleSlow;
  const maxTwinkle = 4.5 * twinkleSlow;

  const showShooting = !reducedMotion;
  const showStars = !reducedMotion;

  const starLayerOpacity = reducedMotion ? 0 : opacity * (isMobile ? 0.85 : 1);

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-0 overflow-hidden',
        className
      )}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'var(--primary-bg, var(--color-bg))' }}
      />

      {/* Voile sous les étoiles : profondeur sans les masquer */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-zinc-950/[0.06] via-transparent to-zinc-950/[0.1]"
        style={{ opacity: overlayOpacity }}
      />

      {showStars && (
        <div
          className="absolute inset-0 z-[1]"
          style={{
            opacity: starLayerOpacity,
            filter:
              'sepia(0.08) hue-rotate(175deg) saturate(0.45) brightness(1.02)',
          }}
        >
          <StarsBackground
            starDensity={starDensity}
            allStarsTwinkle={!isMobile}
            twinkleProbability={isMobile ? 0.35 : 0.55}
            minTwinkleSpeed={minTwinkle}
            maxTwinkleSpeed={maxTwinkle}
            className="h-full min-h-[100dvh] w-full"
          />
        </div>
      )}

      {/* Voile final sous les étoiles filantes pour ne pas les estomper */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-[rgba(9,9,11,0.04)]"
        aria-hidden="true"
      />

      {showShooting && (
        <div
          className="absolute inset-0 z-[3]"
          style={{ opacity: opacity * (isMobile ? 0.58 : 0.72) }}
        >
          <ShootingStars
            minSpeed={Math.max(2.2, 4 * speed)}
            maxSpeed={Math.max(5.5, 12 * speed)}
            minDelay={isMobile ? 900 : 700}
            maxDelay={isMobile ? 3200 : 2600}
            initialDelayMs={0}
            starWidth={isMobile ? 10 : 12}
            starHeight={2.4}
            starColor="#9ca8ba"
            trailColor="#64748b"
          />
          <ShootingStars
            minSpeed={Math.max(2, 3.5 * speed)}
            maxSpeed={Math.max(5, 11 * speed)}
            minDelay={isMobile ? 1100 : 850}
            maxDelay={isMobile ? 3600 : 3000}
            initialDelayMs={isMobile ? 700 : 900}
            starWidth={isMobile ? 9 : 11}
            starHeight={2.1}
            starColor="#8899ae"
            trailColor="#5c6575"
          />
        </div>
      )}
    </div>
  );
}
