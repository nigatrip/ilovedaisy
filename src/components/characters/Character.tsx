import { useId } from 'react';
import type { CharacterColor, CharacterExpression, CharacterState } from './characterTypes';
import { PALETTES, OUTLINE } from './characterColors';
import { POSES } from './characterPoses';

export interface CharacterProps {
  color: CharacterColor;
  state?: CharacterState;
  expression?: CharacterExpression;
  facing?: 'left' | 'right';
  /** rendered height in px */
  size?: number;
  className?: string;
  /** show the daisy brand chest button */
  brand?: boolean;
}

const HIPS: [number, number] = [60, 96];
const SHOULDERS: [number, number] = [60, 74];

function Leg({
  color,
  side,
  rot,
  className,
}: {
  color: keyof typeof PALETTES;
  side: 'l' | 'r';
  rot: number;
  className?: string;
}) {
  const p = PALETTES[color];
  const x = side === 'l' ? 57 : 63;
  return (
    <g
      className={className}
      style={{
        ['--leg' as string]: `${rot}deg`,
        transform: `rotate(${rot}deg)`,
        transformOrigin: `${HIPS[0]}px ${HIPS[1]}px`,
      }}
      transform={`rotate(${rot} ${HIPS[0]} ${HIPS[1]})`}
    >
      <line
        x1={x}
        y1={HIPS[1] - 1}
        x2={x}
        y2={114}
        stroke={OUTLINE}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <line
        x1={x}
        y1={HIPS[1]}
        x2={x}
        y2={113}
        stroke={p.dark}
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      <ellipse cx={x} cy={117} rx={6.5} ry={4.2} fill={p.base} stroke={OUTLINE} strokeWidth={2.5} />
      <ellipse cx={x - (side === 'l' ? 2.4 : -2.4)} cy={116} rx={2.6} ry={1.6} fill={p.light} />
    </g>
  );
}

function Arm({
  color,
  rot,
  className,
}: {
  color: keyof typeof PALETTES;
  rot: number;
  className?: string;
}) {
  const p = PALETTES[color];
  return (
    <g
      className={className}
      style={{
        ['--arm' as string]: `${rot}deg`,
        transform: `rotate(${rot}deg)`,
        transformOrigin: `${SHOULDERS[0]}px ${SHOULDERS[1]}px`,
      }}
      transform={`rotate(${rot} ${SHOULDERS[0]} ${SHOULDERS[1]})`}
    >
      <line
        x1={SHOULDERS[0]}
        y1={SHOULDERS[1] + 2}
        x2={SHOULDERS[0]}
        y2={SHOULDERS[1] + 20}
        stroke={OUTLINE}
        strokeWidth={8}
        strokeLinecap="round"
      />
      <line
        x1={SHOULDERS[0]}
        y1={SHOULDERS[1] + 3}
        x2={SHOULDERS[0]}
        y2={SHOULDERS[1] + 19}
        stroke={p.dark}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <circle cx={SHOULDERS[0]} cy={SHOULDERS[1] + 25} r={6} fill={p.base} stroke={OUTLINE} strokeWidth={2.6} />
      <circle cx={SHOULDERS[0]} cy={SHOULDERS[1] + 24.2} r={2} fill={p.light} />
    </g>
  );
}

function Face({ expression }: { expression: CharacterExpression }) {
  const stroke = OUTLINE;
  const w = 2.6;
  switch (expression) {
    case 'happy':
      return (
        <g className="c-eyes">
          <path d="M42 46 Q48 40.5 54 46" stroke={stroke} strokeWidth={w} strokeLinecap="round" fill="none" />
          <path d="M66 46 Q72 40.5 78 46" stroke={stroke} strokeWidth={w} strokeLinecap="round" fill="none" />
          <path d="M49 58 Q60 68 71 58 Z" fill={stroke} stroke={stroke} strokeWidth={1.6} strokeLinejoin="round" />
          <circle cx="44" cy="53" r="2.6" fill="#ff9db1" opacity="0.55" />
          <circle cx="76" cy="53" r="2.6" fill="#ff9db1" opacity="0.55" />
        </g>
      );
    case 'surprised':
      return (
        <g className="c-eyes">
          <circle cx="48" cy="46" r="3.6" fill="#fff" stroke={stroke} strokeWidth={2.4} />
          <circle cx="72" cy="46" r="3.6" fill="#fff" stroke={stroke} strokeWidth={2.4} />
          <circle cx="48.8" cy="45.2" r="1.2" fill={stroke} />
          <circle cx="72.8" cy="45.2" r="1.2" fill={stroke} />
          <circle cx="60" cy="61" r="4" fill={stroke} stroke={stroke} strokeWidth={1.6} />
          <circle cx="58.8" cy="59.8" r="1.2" fill="#fff" />
        </g>
      );
    case 'determined':
      return (
        <g className="c-eyes">
          <path d="M42 47 L54 45.5" stroke={stroke} strokeWidth={3} strokeLinecap="round" />
          <path d="M78 47 L66 45.5" stroke={stroke} strokeWidth={3} strokeLinecap="round" />
          <path d="M48 55 L72 55" stroke={stroke} strokeWidth={2.8} strokeLinecap="round" />
        </g>
      );
    case 'sad':
      return (
        <g className="c-eyes">
          <path d="M42 46 Q48 50.5 54 46" stroke={stroke} strokeWidth={w} strokeLinecap="round" fill="none" />
          <path d="M66 46 Q72 50.5 78 46" stroke={stroke} strokeWidth={w} strokeLinecap="round" fill="none" />
          <path d="M50 60 Q60 54 70 60" stroke={stroke} strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </g>
      );
    case 'cross':
      return (
        <g className="c-eyes">
          <path d="M44 42 L52 50" stroke={stroke} strokeWidth={2.8} strokeLinecap="round" />
          <path d="M52 42 L44 50" stroke={stroke} strokeWidth={2.8} strokeLinecap="round" />
          <path d="M68 42 L76 50" stroke={stroke} strokeWidth={2.8} strokeLinecap="round" />
          <path d="M76 42 L68 50" stroke={stroke} strokeWidth={2.8} strokeLinecap="round" />
          <path d="M49 59 L71 57" stroke={stroke} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    default:
      return (
        <g className="c-eyes">
          <circle cx="48" cy="46" r="2.8" fill={stroke} />
          <circle cx="72" cy="46" r="2.8" fill={stroke} />
          <path d="M51 58 Q60 63.5 69 58" stroke={stroke} strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <circle cx="43.5" cy="53" r="2.4" fill="#ff9db1" opacity="0.4" />
          <circle cx="76.5" cy="53" r="2.4" fill="#ff9db1" opacity="0.4" />
        </g>
      );
  }
}

function Head({
  color,
  rot,
  dy,
  expression,
}: {
  color: keyof typeof PALETTES;
  rot: number;
  dy: number;
  expression: CharacterExpression;
}) {
  const p = PALETTES[color];
  const id = useId();
  const grad = `${id}-head`;
  return (
    <g transform={`rotate(${rot} 60 62) translate(0 ${dy})`}>
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.light} />
          <stop offset="0.55" stopColor={p.base} />
          <stop offset="1" stopColor={p.dark} />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="44" rx="26" ry="23.5" fill={`url(#${grad})`} stroke={OUTLINE} strokeWidth={3.4} />
      <ellipse cx="60" cy="42.5" rx="20" ry="16.5" fill={p.light} opacity="0.28" />
      <path
        d="M56 21.5 Q60 17 65 19 Q66.5 23 61 25.5 Q57 26 56 21.5 Z"
        fill={p.dark}
        stroke={OUTLINE}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <circle cx="34" cy="47" r="4.4" fill={p.base} stroke={OUTLINE} strokeWidth={2.4} />
      <circle cx="86" cy="47" r="4.4" fill={p.base} stroke={OUTLINE} strokeWidth={2.4} />
      <circle cx="34" cy="47" r="2" fill={p.belly} />
      <circle cx="86" cy="47" r="2" fill={p.belly} />
      <g transform="translate(0 3)">
        <Face expression={expression} />
      </g>
    </g>
  );
}

function DaisyButton() {
  const id = useId();
  const petal = `${id}-petal`;
  return (
    <g transform="translate(60 82)">
      <defs>
        <linearGradient id={petal} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffd9e8" />
        </linearGradient>
      </defs>
      {[-3, 0, 3].map((dx, i) => (
        <ellipse key={i} cx={dx * 2.4} cy={i === 1 ? -3.2 : 1.2} rx={2.1} ry={3.1} fill={`url(#${petal})`} stroke="#f39c7f" strokeWidth={0.7} />
      ))}
      <circle r={2.1} fill="#ffc83d" stroke="#d97706" strokeWidth={0.7} />
    </g>
  );
}

function Body({ color, rot, brand }: { color: keyof typeof PALETTES; rot: number; brand: boolean }) {
  const p = PALETTES[color];
  const id = useId();
  const grad = `${id}-body`;
  return (
    <g transform={`rotate(${rot} 60 82)`}>
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.light} />
          <stop offset="0.5" stopColor={p.base} />
          <stop offset="1" stopColor={p.dark} />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="82" rx="19.5" ry="16" fill={`url(#${grad})`} stroke={OUTLINE} strokeWidth={3.4} />
      <ellipse cx="60" cy="88" rx="12" ry="7.5" fill={p.belly} opacity="0.5" />
      {brand && <DaisyButton />}
    </g>
  );
}

const ROOT_ANIM: Record<string, string> = {
  none: '',
  bob: 'c-anim-bob',
  runBob: 'c-anim-runbob',
  celebrate: 'c-anim-celebrate',
  loseBob: 'c-anim-losebob',
};

const LIMB_ANIM: Record<string, { legL: string; legR: string; armL: string; armR: string }> = {
  none: { legL: '', legR: '', armL: '', armR: '' },
  bob: { legL: '', legR: '', armL: '', armR: '' },
  runBob: { legL: 'c-swing-leg-l', legR: 'c-swing-leg-r', armL: 'c-swing-arm-l', armR: 'c-swing-arm-r' },
  celebrate: { legL: '', legR: '', armL: 'c-wave-arm', armR: 'c-wave-arm' },
  loseBob: { legL: '', legR: '', armL: '', armR: '' },
};

export function Character({
  color,
  state = 'idle',
  expression,
  facing = 'right',
  size = 120,
  className,
  brand = false,
}: CharacterProps) {
  const pose = POSES[state];
  const faceExpression = expression ?? pose.expression;
  const sign = facing === 'left' ? -1 : 1;
  const limbAnim = LIMB_ANIM[pose.anim];
  const rootAnim = ROOT_ANIM[pose.anim];

  return (
    <svg
      viewBox="0 0 120 128"
      height={size}
      width={size * (120 / 128)}
      className={className}
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      <ellipse cx="60" cy="121" rx="21" ry="5.6" fill="#2a1a55" opacity="0.28" />
      <g
        transform={`translate(0 ${pose.dy}) rotate(${pose.tilt} 60 96) scale(${sign * pose.sx} ${pose.sy})`}
      >
        <g className={rootAnim}>
          <g style={{ ['--armL' as string]: `${pose.armL}deg`, ['--armR' as string]: `${pose.armR}deg`, ['--legL' as string]: `${pose.legL}deg`, ['--legR' as string]: `${pose.legR}deg` }}>
            <Leg color={color} side="l" rot={pose.legL} className={limbAnim.legL} />
            <Leg color={color} side="r" rot={pose.legR} className={limbAnim.legR} />
            <Arm color={color} rot={pose.armL} className={limbAnim.armL} />
            <Body color={color} rot={pose.bodyRot} brand={brand} />
            <Head color={color} rot={pose.headRot} dy={pose.headDy} expression={faceExpression} />
            <Arm color={color} rot={pose.armR} className={limbAnim.armR} />
          </g>
        </g>
      </g>
    </svg>
  );
}
