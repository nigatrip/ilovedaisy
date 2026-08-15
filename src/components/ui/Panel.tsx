import type { ReactNode } from 'react';

export function Panel({ children, className = '', solid = false }: { children: ReactNode; className?: string; solid?: boolean }) {
  return <div className={`${solid ? 'panel-solid' : 'panel'} ${className}`}>{children}</div>;
}

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`chip ${className}`}>{children}</span>;
}
