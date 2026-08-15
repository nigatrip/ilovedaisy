import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'p1' | 'p2' | 'daisy' | 'grape' | 'lime' | 'ghost';

interface ArcadeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const SIZES: Record<string, string> = {
  sm: 'text-sm px-4 py-2 rounded-xl',
  md: 'text-base px-6 py-3 rounded-[1.25rem]',
  lg: 'text-xl px-8 py-4 rounded-[1.5rem]',
};

const VARIANTS: Record<Variant, string> = {
  p1: 'arcade-btn--p1',
  p2: 'arcade-btn--p2',
  daisy: 'arcade-btn--daisy',
  grape: 'arcade-btn--grape',
  lime: 'arcade-btn--lime',
  ghost: 'bg-white/10 border-2 border-white/25 text-white',
};

export function ArcadeButton({ variant = 'p1', size = 'md', className = '', children, ...rest }: ArcadeButtonProps) {
  return (
    <button
      className={`arcade-btn ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
