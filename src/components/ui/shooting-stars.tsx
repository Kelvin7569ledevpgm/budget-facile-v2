"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useState, useRef, useId } from "react";

interface ShootingStar {
  id: number;
  x: number;
  y: number;
  angle: number;
  scale: number;
  speed: number;
  distance: number;
}

export interface ShootingStarsProps {
  minSpeed?: number;
  maxSpeed?: number;
  minDelay?: number;
  maxDelay?: number;
  starColor?: string;
  trailColor?: string;
  starWidth?: number;
  starHeight?: number;
  /** Retarde la première étoile (utile pour décaler plusieurs calques). */
  initialDelayMs?: number;
  className?: string;
}

const getRandomStartPoint = () => {
  const w = typeof window !== "undefined" ? window.innerWidth : 1200;
  const h = typeof window !== "undefined" ? window.innerHeight : 800;
  const side = Math.floor(Math.random() * 4);
  const offset = Math.random() * w;

  switch (side) {
    case 0:
      return { x: offset, y: 0, angle: 45 };
    case 1:
      return { x: w, y: offset, angle: 135 };
    case 2:
      return { x: offset, y: h, angle: 225 };
    case 3:
      return { x: 0, y: offset, angle: 315 };
    default:
      return { x: 0, y: 0, angle: 45 };
  }
};

function createShootingStar(
  minSpeed: number,
  maxSpeed: number,
): ShootingStar {
  const { x, y, angle } = getRandomStartPoint();
  return {
    id: Date.now() + Math.random(),
    x,
    y,
    angle,
    scale: 1,
    speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
    distance: 0,
  };
}

export const ShootingStars: React.FC<ShootingStarsProps> = ({
  minSpeed = 10,
  maxSpeed = 30,
  minDelay = 1200,
  maxDelay = 4200,
  starColor = "#9E00FF",
  trailColor = "#2EB9DF",
  starWidth = 10,
  starHeight = 2,
  initialDelayMs = 0,
  className,
}) => {
  const [star, setStar] = useState<ShootingStar | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const starRef = useRef<ShootingStar | null>(null);
  const rafRef = useRef(0);
  const respawnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hadStarRef = useRef(false);
  const gradientId = useId().replace(/:/g, "");

  starRef.current = star;

  useEffect(() => {
    if (star) hadStarRef.current = true;
  }, [star]);

  const delayRange = Math.max(200, maxDelay - minDelay);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setStar(createShootingStar(minSpeed, maxSpeed));
    }, initialDelayMs);
    return () => clearTimeout(t);
  }, [minSpeed, maxSpeed, minDelay, maxDelay, initialDelayMs]);

  useEffect(() => {
    if (star !== null) return;
    if (!hadStarRef.current) return;

    if (respawnTimeoutRef.current) {
      clearTimeout(respawnTimeoutRef.current);
    }

    const wait = minDelay + Math.random() * delayRange;
    respawnTimeoutRef.current = setTimeout(() => {
      setStar(createShootingStar(minSpeed, maxSpeed));
    }, wait);

    return () => {
      if (respawnTimeoutRef.current) {
        clearTimeout(respawnTimeoutRef.current);
      }
    };
  }, [star, minSpeed, maxSpeed, minDelay, maxDelay, delayRange]);

  useEffect(() => {
    if (!star) return;

    let cancelled = false;

    const loop = () => {
      if (cancelled) return;
      const prev = starRef.current;
      if (!prev) return;

      const w = window.innerWidth;
      const h = window.innerHeight;

      const newX =
        prev.x + prev.speed * Math.cos((prev.angle * Math.PI) / 180);
      const newY =
        prev.y + prev.speed * Math.sin((prev.angle * Math.PI) / 180);
      const newDistance = prev.distance + prev.speed;
      const newScale = 1 + newDistance / 100;

      if (
        newX < -40 ||
        newX > w + 40 ||
        newY < -40 ||
        newY > h + 40
      ) {
        setStar(null);
        return;
      }

      const next: ShootingStar = {
        ...prev,
        x: newX,
        y: newY,
        distance: newDistance,
        scale: newScale,
      };
      starRef.current = next;
      setStar(next);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [star?.id]);

  const fillUrl = `url(#${gradientId})`;

  return (
    <svg
      ref={svgRef}
      className={cn("absolute inset-0 h-full w-full overflow-visible", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor={trailColor} stopOpacity="0" />
          <stop offset="38%" stopColor={trailColor} stopOpacity="0.42" />
          <stop offset="100%" stopColor={starColor} stopOpacity="0.78" />
        </linearGradient>
      </defs>
      {star && (
        <rect
          key={star.id}
          x={star.x}
          y={star.y}
          width={Math.max(starWidth * star.scale, starWidth)}
          height={starHeight}
          fill={fillUrl}
          transform={`rotate(${star.angle}, ${
            star.x + (starWidth * star.scale) / 2
          }, ${star.y + starHeight / 2})`}
        />
      )}
    </svg>
  );
};
