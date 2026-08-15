import type { CharacterColor } from './characterTypes';

export type CharacterEffectType =
  | 'none'
  | 'stars'
  | 'sweat'
  | 'question'
  | 'speed'
  | 'zing';

export function CharacterEffect({
  type,
  color,
}: {
  type: CharacterEffectType;
  color: CharacterColor;
}) {
  const c = color === 'yellow' ? '#c77d12' : '#2a1a55';
  switch (type) {
    case 'stars':
      return (
        <g stroke={c} strokeWidth={2.4} strokeLinecap="round" fill="none">
          <g transform="translate(24 20) scale(0.9)">
            <path d="M0 4 L2 10 L8 10 L3.2 13.4 L5 19.6 L0 16 L-5 19.6 L-3.2 13.4 L-8 10 L-2 10 Z" fill="#ffd23f" stroke="none" />
          </g>
          <g transform="translate(98 14) scale(0.7)">
            <path d="M0 4 L2 10 L8 10 L3.2 13.4 L5 19.6 L0 16 L-5 19.6 L-3.2 13.4 L-8 10 L-2 10 Z" fill="#8ce563" stroke="none" />
          </g>
          <path d="M88 42 v-10" />
          <path d="M96 34 l-8 8" />
        </g>
      );
    case 'sweat':
      return (
        <g>
          <path d="M16 30 Q16 20 23 20 Q30 20 30 30 Q30 36 23 38 Q16 36 16 30 Z" fill="#7fd4ff" stroke="#2a1a55" strokeWidth={2.4} />
        </g>
      );
    case 'question':
      return (
        <g fill="#fff" stroke="#2a1a55" strokeWidth={2.4}>
          <circle cx="100" cy="24" r="9" fill="#ffd23f" />
          <text x="100" y="29" textAnchor="middle" fontSize="13" fontWeight="800" fill="#2a1a55" stroke="none">!</text>
        </g>
      );
    case 'speed':
      return (
        <g stroke="#fff" strokeWidth={2.6} strokeLinecap="round" opacity={0.9}>
          <line x1={-2} y1={46} x2={16} y2={46} />
          <line x1={6} y1={60} x2={20} y2={60} />
          <line x1={-4} y1={74} x2={14} y2={74} />
        </g>
      );
    case 'zing':
      return (
        <g stroke="#ffd23f" strokeWidth={2.6} strokeLinecap="round">
          <path d="M6 18 l8 8 M14 18 l-8 8" />
        </g>
      );
    default:
      return null;
  }
}
