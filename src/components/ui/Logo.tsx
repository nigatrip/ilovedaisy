export function DaisyMark({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="daisy-petal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffd9e8" />
        </linearGradient>
        <radialGradient id="daisy-core" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#ffe97d" />
          <stop offset="0.6" stopColor="#ffc83d" />
          <stop offset="1" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
      <g transform="translate(32 30)">
        <g fill="url(#daisy-petal)" stroke="#f39c7f" strokeWidth="1.4">
          <ellipse cx="0" cy="-16" rx="7.5" ry="12" />
          <ellipse cx="0" cy="16" rx="7.5" ry="12" />
          <ellipse cx="-16" cy="0" rx="12" ry="7.5" />
          <ellipse cx="16" cy="0" rx="12" ry="7.5" />
          <ellipse cx="-11" cy="-11" rx="10" ry="6.5" transform="rotate(45 -11 -11)" />
          <ellipse cx="11" cy="-11" rx="10" ry="6.5" transform="rotate(-45 11 -11)" />
          <ellipse cx="-11" cy="11" rx="10" ry="6.5" transform="rotate(-45 -11 11)" />
          <ellipse cx="11" cy="11" rx="10" ry="6.5" transform="rotate(45 11 11)" />
        </g>
        <circle r="10.5" fill="url(#daisy-core)" stroke="#d97706" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

export function Logo({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dims = size === 'lg' ? 64 : size === 'sm' ? 28 : 42;
  const text = size === 'lg' ? 'text-5xl' : size === 'sm' ? 'text-xl' : 'text-4xl';
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <DaisyMark size={dims} />
      <span className={`font-display ${text} text-cream text-outline tracking-wide`}>
        ilove<span className="text-daisy">daisy</span>
      </span>
    </div>
  );
}
