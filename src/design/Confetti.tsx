import { useMemo } from 'react';

const COLORS = ['#ff4d5e', '#31a8ff', '#ffd23f', '#8ce563', '#b06cff', '#ff6fce', '#7fd4ff'];

interface Piece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  sway: number;
  spin: number;
  size: number;
}

export function Confetti({ count = 60 }: { count?: number }) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.4,
        duration: 2.2 + Math.random() * 1.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        sway: (Math.random() - 0.5) * 120,
        spin: 360 + Math.random() * 540,
        size: 7 + Math.random() * 7,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.5,
            backgroundColor: p.color,
            borderRadius: i % 3 === 0 ? '50%' : '2px',
            animation: `confettiFall ${p.duration}s linear ${p.delay}s infinite`,
            ['--sway' as string]: `${p.sway}px`,
            ['--spin' as string]: `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}
