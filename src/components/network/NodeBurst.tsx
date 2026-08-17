import { memo, useEffect, useRef, useState } from 'react';
import { subscribe } from '@/motion/scheduler';

export interface BurstOrigin {
  x: number;
  y: number;
  color: string;
  token: number;
}

export interface NodeBurstProps {
  origin: BurstOrigin | null;
}

interface Particle {
  angle: number;
  speed: number;
  life: number;
}

const COUNT = 16;

export const NodeBurst = memo(function NodeBurst({ origin }: NodeBurstProps) {
  const startRef = useRef(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    if (!origin) {
      setParticles([]);
      setProgress(1);
      return;
    }
    startRef.current = performance.now();
    setParticles(
      Array.from({ length: COUNT }, (_, i) => ({
        angle: (i / COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
        speed: 40 + Math.random() * 60,
        life: 0.8 + Math.random() * 0.2,
      })),
    );
    setProgress(0);

    const unsub = subscribe((now) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / 320);
      setProgress(t);
      if (t >= 1) unsub();
    });
    return unsub;
  }, [origin]);

  if (!origin || progress >= 1 || particles.length === 0) return null;

  return (
    <g aria-hidden className="pointer-events-none">
      <circle
        cx={origin.x}
        cy={origin.y}
        r={18 + progress * 28}
        fill="none"
        stroke={origin.color}
        strokeOpacity={1 - progress}
        strokeWidth={2}
      />
      {particles.map((p, i) => {
        const dist = p.speed * progress * p.life;
        const x = origin.x + Math.cos(p.angle) * dist;
        const y = origin.y + Math.sin(p.angle) * dist;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={2.5 * (1 - progress * 0.6)}
            fill={origin.color}
            fillOpacity={1 - progress}
          />
        );
      })}
    </g>
  );
});
