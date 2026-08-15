import { Character } from '../characters/Character';
import { CharacterEffect } from '../characters/CharacterEffect';

const OUT = '#2a1a55';

function Cloud({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} opacity={0.85}>
      <ellipse cx="-10" cy="0" rx="9" ry="5" fill="#fff" />
      <ellipse cx="2" cy="-4" rx="8" ry="6" fill="#fff" />
      <ellipse cx="12" cy="0" rx="8" ry="5" fill="#fff" />
    </g>
  );
}

function Sun({ cx, cy, r = 10 }: { cx: number; cy: number; r?: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={r} fill="#ffd23f" stroke={OUT} strokeWidth={2} />
      <g stroke="#fff" strokeWidth={2} strokeLinecap="round">
        <line x1={0} y1={-r - 4} x2={0} y2={-r - 9} />
        <line x1={0} y1={r + 4} x2={0} y2={r + 9} />
        <line x1={-r - 4} y1={0} x2={-r - 9} y2={0} />
        <line x1={r + 4} y1={0} x2={r + 9} y2={0} />
      </g>
    </g>
  );
}

export function SumoArt() {
  return (
    <svg viewBox="0 0 160 100" width="100%" height="100%">
      <defs>
        <linearGradient id="sumo-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffcf6b" />
          <stop offset="1" stopColor="#ff6b7a" />
        </linearGradient>
      </defs>
      <rect width="160" height="100" fill="url(#sumo-bg)" />
      <Sun cx={132} cy={18} />
      <Cloud cx={30} cy={16} />
      <Cloud cx={95} cy={28} s={0.7} />
      <ellipse cx="60" cy="92" rx="52" ry="8" fill="#ff5e6b" opacity="0.5" />
      <ellipse cx="80" cy="72" rx="42" ry="9" fill="#a52638" stroke={OUT} strokeWidth={2.5} />
      <ellipse cx="80" cy="71" rx="36" ry="6.5" fill="#e0344a" stroke={OUT} strokeWidth={1.8} />
      <g transform="translate(40 42)">
        <Character color="blue" state="push" facing="left" size={34} />
      </g>
      <g transform="translate(84 42)">
        <Character color="red" state="push" facing="right" size={34} />
      </g>
      <text x="80" y="14" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" stroke={OUT} strokeWidth="0.8">SUMO PUSH</text>
    </svg>
  );
}

export function TugArt() {
  return (
    <svg viewBox="0 0 160 100" width="100%" height="100%">
      <defs>
        <linearGradient id="tug-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b06cff" />
          <stop offset="1" stopColor="#4a1a9e" />
        </linearGradient>
      </defs>
      <rect width="160" height="100" fill="url(#tug-bg)" />
      <Cloud cx={26} cy={16} />
      <Cloud cx={130} cy={22} s={0.8} />
      <ellipse cx="80" cy="94" rx="64" ry="7" fill="#2a1a55" opacity="0.3" />
      <rect x="74" y="80" width="12" height="14" rx="2" fill="#fff" stroke={OUT} strokeWidth={2} />
      <line x1="30" y1="62" x2="130" y2="62" stroke="#ffe07a" strokeWidth={4} strokeLinecap="round" />
      <line x1="62" y1="60" x2="62" y2="74" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
      <g transform="translate(34 36)">
        <Character color="red" state="pull" facing="right" size={34} />
      </g>
      <g transform="translate(92 36)">
        <Character color="blue" state="pull" facing="left" size={34} />
      </g>
      <text x="80" y="16" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" stroke={OUT} strokeWidth="0.8">TUG OF WAR</text>
    </svg>
  );
}

export function FootballArt() {
  return (
    <svg viewBox="0 0 160 100" width="100%" height="100%">
      <rect width="160" height="100" fill="#57d95f" />
      <rect x="16" y="14" width="128" height="76" rx="10" fill="#7ee06f" stroke="#fff" strokeWidth={3} />
      <line x1="80" y1="14" x2="80" y2="90" stroke="#fff" strokeWidth={3} />
      <circle cx="80" cy="52" r="7" fill="none" stroke="#fff" strokeWidth={2} />
      <rect x="16" y="38" width="14" height="28" rx="3" fill="#fff" stroke={OUT} strokeWidth={2} />
      <rect x="130" y="38" width="14" height="28" rx="3" fill="#fff" stroke={OUT} strokeWidth={2} />
      <g transform="translate(34 48)">
        <Character color="red" state="run" facing="right" size={30} />
      </g>
      <g transform="translate(98 48)">
        <Character color="blue" state="run" facing="left" size={30} />
      </g>
      <ellipse cx="78" cy="72" rx="5.5" ry="4" fill="#fff" stroke={OUT} strokeWidth={1.8} />
      <text x="80" y="12" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" stroke={OUT} strokeWidth="0.8">FOOTBALL</text>
    </svg>
  );
}

function MiniTank({ x, y, color, turret }: { x: number; y: number; color: string; turret: number }) {
  const dark = color === '#31a8ff' ? '#144ba6' : '#a52638';
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="10" rx="16" ry="4" fill={OUT} opacity="0.3" />
      <rect x="-16" y="-2" width="32" height="12" rx="4" fill={color} stroke={OUT} strokeWidth={2} />
      <circle cx="-9" cy="6" r="3.4" fill={OUT} />
      <circle cx="9" cy="6" r="3.4" fill={OUT} />
      <circle cx="0" cy="1" r="7" fill={dark} stroke={OUT} strokeWidth={2} />
      <rect x={turret > 0 ? 6 : -2} y="-10" width="9" height="7" rx="2.5" fill={dark} stroke={OUT} strokeWidth={1.6} transform={`rotate(${turret} 2 -6)`} />
    </g>
  );
}

export function TankArt() {
  return (
    <svg viewBox="0 0 160 100" width="100%" height="100%">
      <rect width="160" height="100" fill="#3a5a40" />
      <rect x="10" y="10" width="140" height="80" rx="12" fill="#4f7a58" stroke={OUT} strokeWidth={3} />
      <rect x="30" y="30" width="18" height="26" rx="3" fill="#6d4a2f" stroke={OUT} strokeWidth={2} />
      <rect x="112" y="42" width="18" height="20" rx="3" fill="#6d4a2f" stroke={OUT} strokeWidth={2} />
      <rect x="18" y="62" width="124" height="10" fill="#8f5f3a" stroke={OUT} strokeWidth={2} rx="4" />
      <MiniTank x={48} y={54} color="#ff4d5e" turret={-8} />
      <MiniTank x={112} y={54} color="#31a8ff" turret={188} />
      <circle cx="52" cy="40" r="7" fill="#ffd23f" opacity="0.9" />
      <circle cx="108" cy="36" r="6" fill="#ff6b7a" opacity="0.9" />
      <path d="M46 46 l-8 4 M42 42 l-6 2" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      <text x="80" y="12" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" stroke={OUT} strokeWidth="0.8">TANK DUEL</text>
    </svg>
  );
}

export function RaceArt() {
  return (
    <svg viewBox="0 0 160 100" width="100%" height="100%">
      <defs>
        <linearGradient id="race-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fd4ff" />
          <stop offset="1" stopColor="#3d8bff" />
        </linearGradient>
      </defs>
      <rect width="160" height="100" fill="url(#race-bg)" />
      <Sun cx={20} cy={18} r={8} />
      <Cloud cx={110} cy={16} />
      <Cloud cx={46} cy={28} s={0.7} />
      <path d="M0 62 Q40 30 80 58 T160 48" fill="none" stroke="#4a3a7a" strokeWidth={14} strokeLinecap="round" opacity={0.4} />
      <path d="M0 62 Q40 30 80 58 T160 48" fill="none" stroke="#ffd23f" strokeWidth={7} strokeDasharray="2 10" strokeLinecap="round" opacity={0.9} />
      <g transform="translate(96 52) rotate(-8)">
        <rect x="-11" y="-5" width="22" height="10" rx="5" fill="#ff4d5e" stroke={OUT} strokeWidth={2} />
        <rect x="-4" y="-10" width="8" height="7" rx="3" fill="#ff4d5e" stroke={OUT} strokeWidth={1.6} />
        <circle cx="-7" cy="6" r="2.6" fill={OUT} />
        <circle cx="7" cy="6" r="2.6" fill={OUT} />
      </g>
      <g transform="translate(140 40) rotate(6)">
        <rect x="-11" y="-5" width="22" height="10" rx="5" fill="#31a8ff" stroke={OUT} strokeWidth={2} />
        <rect x="-4" y="-10" width="8" height="7" rx="3" fill="#31a8ff" stroke={OUT} strokeWidth={1.6} />
        <circle cx="-7" cy="6" r="2.6" fill={OUT} />
        <circle cx="7" cy="6" r="2.6" fill={OUT} />
      </g>
      <path d="M18 66 l16 6 M18 60 l18 6" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
      <text x="80" y="14" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" stroke={OUT} strokeWidth="0.8">MICRO RACE</text>
    </svg>
  );
}

export function TicTacToeArt() {
  return (
    <svg viewBox="0 0 160 100" width="100%" height="100%">
      <defs>
        <linearGradient id="ttt-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#35e0c8" />
          <stop offset="1" stopColor="#1d8f7a" />
        </linearGradient>
      </defs>
      <rect width="160" height="100" fill="url(#ttt-bg)" />
      <Cloud cx={26} cy={14} s={0.7} />
      <g transform="translate(34 22)">
        <rect width="92" height="64" rx="10" fill="#fff" stroke={OUT} strokeWidth={3} />
        <line x1="30" y1="0" x2="30" y2="64" stroke={OUT} strokeWidth={3} />
        <line x1="61" y1="0" x2="61" y2="64" stroke={OUT} strokeWidth={3} />
        <line x1="0" y1="21" x2="92" y2="21" stroke={OUT} strokeWidth={3} />
        <line x1="0" y1="42" x2="92" y2="42" stroke={OUT} strokeWidth={3} />
        <g stroke="#ff4d5e" strokeWidth={4} strokeLinecap="round">
          <path d="M9 5 L21 17 M21 5 L9 17" />
        </g>
        <circle cx="45" cy="32" r="7" fill="none" stroke="#31a8ff" strokeWidth={4} />
        <g stroke="#ff4d5e" strokeWidth={4} strokeLinecap="round">
          <path d="M76 26 L88 38 M88 26 L76 38" />
        </g>
        <circle cx="15" cy="53" r="7" fill="none" stroke="#31a8ff" strokeWidth={4} />
      </g>
      <g transform="translate(12 62) scale(0.85)">
        <Character color="red" state="idle" size={30} />
      </g>
      <g transform="translate(116 62) scale(0.85)">
        <Character color="blue" state="idle" facing="left" size={30} />
      </g>
      <text x="80" y="12" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" stroke={OUT} strokeWidth="0.8">TIC TAC TOE</text>
    </svg>
  );
}

export function Connect4Art() {
  return (
    <svg viewBox="0 0 160 100" width="100%" height="100%">
      <defs>
        <linearGradient id="c4-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff9f1c" />
          <stop offset="1" stopColor="#ff4d5e" />
        </linearGradient>
      </defs>
      <rect width="160" height="100" fill="url(#c4-bg)" />
      <Sun cx={128} cy={16} r={9} />
      <g transform="translate(36 26)">
        <rect x="0" y="12" width="92" height="56" rx="8" fill="#2a1a55" stroke="#2a1a55" strokeWidth={3} />
        {[0, 1, 2, 3, 4, 5].map((row) =>
          [0, 1, 2, 3, 4, 5].map((col) => (
            <circle key={`${row}-${col}`} cx={9 + col * 15} cy={20 + row * 8.5} r={4.6} fill="#4a3a7a" />
          )),
        )}
        <circle cx={9} cy={28.5} r={4.6} fill="#ff4d5e" stroke="#fff" strokeWidth={1} />
        <circle cx={39} cy={28.5} r={4.6} fill="#31a8ff" stroke="#fff" strokeWidth={1} />
        <circle cx={24} cy={37} r={4.6} fill="#ff4d5e" stroke="#fff" strokeWidth={1} />
        <circle cx={69} cy={37} r={4.6} fill="#31a8ff" stroke="#fff" strokeWidth={1} />
        <circle cx={9} cy={45.5} r={4.6} fill="#ff4d5e" stroke="#fff" strokeWidth={1} />
        <circle cx={84} cy={45.5} r={4.6} fill="#31a8ff" stroke="#fff" strokeWidth={1} />
      </g>
      <text x="80" y="12" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" stroke={OUT} strokeWidth="0.8">CONNECT FOUR</text>
    </svg>
  );
}

export function TapBattleArt() {
  return (
    <svg viewBox="0 0 160 100" width="100%" height="100%">
      <defs>
        <linearGradient id="tap-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb2e4" />
          <stop offset="1" stopColor="#e040a8" />
        </linearGradient>
      </defs>
      <rect width="160" height="100" fill="url(#tap-bg)" />
      <Cloud cx={32} cy={16} />
      <Cloud cx={124} cy={14} s={0.7} />
      <circle cx="80" cy="48" r="30" fill="#fff" opacity="0.18" />
      <ellipse cx="80" cy="92" rx="58" ry="7" fill="#2a1a55" opacity="0.3" />
      <g transform="translate(42 46)">
        <Character color="red" state="attack" size={32} />
      </g>
      <g transform="translate(88 46)">
        <Character color="blue" state="attack" facing="left" size={32} />
      </g>
      <g transform="translate(80 26) scale(0.8)">
        <CharacterEffect type="zing" color="red" />
      </g>
      <path d="M6 60 a8 8 0 0 1 0 -16" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" transform="rotate(160 6 52)" />
      <text x="80" y="12" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" stroke={OUT} strokeWidth="0.8">TAP BATTLE</text>
    </svg>
  );
}

export function CardArt({ gameId }: { gameId: string }) {
  switch (gameId) {
    case 'sumo':
      return <SumoArt />;
    case 'tug':
      return <TugArt />;
    case 'football':
      return <FootballArt />;
    case 'tank':
      return <TankArt />;
    case 'race':
      return <RaceArt />;
    case 'tictactoe':
      return <TicTacToeArt />;
    case 'connect4':
      return <Connect4Art />;
    case 'tapbattle':
      return <TapBattleArt />;
    default:
      return <SumoArt />;
  }
}
