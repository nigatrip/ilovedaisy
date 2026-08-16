import { useEffect, useRef, useState } from 'react';
import { getRoomStore } from '../../net/roomStore';
import { Character } from '../../components/characters/Character';
import { sound } from '../../audio/SoundManager';

interface SumoPushProps {
  isDemo: boolean;
  round: number;
  onEnd: (winner: 0 | 1 | 2) => void;
}

const PAD_RADIUS = 140;
const CHAR_RADIUS = 28;
const PUSH_FORCE = 2.8;
const FRICTION = 0.92;
const MAX_SPEED = 7;

export function SumoPush({ isDemo, round, onEnd }: SumoPushProps) {
  const store = getRoomStore();
  const snap = store.getSnapshot();
  const meId = snap.me.id;
  const peer = snap.room?.players.find((p) => p.id !== meId);

  const [pos, setPos] = useState({ x: 0, y: -70 });
  const [peerPos, setPeerPos] = useState({ x: 0, y: 70 });
  const [vel, setVel] = useState({ x: 0, y: 0 });
  const [peerVel, setPeerVel] = useState({ x: 0, y: 0 });
  const [keys, setKeys] = useState({ up: false, down: false, left: false, right: false });
  const keysRef = useRef(keys);
  const posRef = useRef(pos);
  const velRef = useRef(vel);
  const peerPosRef = useRef(peerPos);
  const peerVelRef = useRef(peerVel);
  const animRef = useRef<number | null>(null);
  const endedRef = useRef(false);

  useEffect(() => { keysRef.current = keys; }, [keys]);
  useEffect(() => { posRef.current = pos; }, [pos]);
  useEffect(() => { velRef.current = vel; }, [vel]);
  useEffect(() => { peerPosRef.current = peerPos; }, [peerPos]);
  useEffect(() => { peerVelRef.current = peerVel; }, [peerVel]);

  const finish = (w: 0 | 1 | 2) => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (animRef.current) window.cancelAnimationFrame(animRef.current);
    window.setTimeout(() => onEnd(w), 800);
  };

  const checkOut = (p: { x: number; y: number }) => Math.hypot(p.x, p.y) > PAD_RADIUS - CHAR_RADIUS;

  const step = () => {
    if (endedRef.current) return;

    let vx = velRef.current.x;
    let vy = velRef.current.y;

    if (keysRef.current.up) vy -= 0.35;
    if (keysRef.current.down) vy += 0.35;
    if (keysRef.current.left) vx -= 0.35;
    if (keysRef.current.right) vx += 0.35;

    const speed = Math.hypot(vx, vy);
    if (speed > MAX_SPEED) {
      vx = (vx / speed) * MAX_SPEED;
      vy = (vy / speed) * MAX_SPEED;
    }

    vx *= FRICTION;
    vy *= FRICTION;

    let nx = posRef.current.x + vx;
    let ny = posRef.current.y + vy;
    const dist = Math.hypot(nx, ny);
    if (dist > PAD_RADIUS - CHAR_RADIUS) {
      const scale = (PAD_RADIUS - CHAR_RADIUS) / dist;
      nx *= scale;
      ny *= scale;
      vx *= 0.3;
      vy *= 0.3;
    }

    setPos({ x: nx, y: ny });
    setVel({ x: vx, y: vy });
    posRef.current = { x: nx, y: ny };
    velRef.current = { x: vx, y: vy };

    const dx = peerPosRef.current.x - posRef.current.x;
    const dy = peerPosRef.current.y - posRef.current.y;
    const d = Math.hypot(dx, dy);
    if (d < CHAR_RADIUS * 2 && d > 0.1) {
      const overlap = (CHAR_RADIUS * 2 - d) / 2;
      const nx = (dx / d) * overlap;
      const ny = (dy / d) * overlap;
      const pushX = (dx / d) * PUSH_FORCE;
      const pushY = (dy / d) * PUSH_FORCE;
      setPos((p) => ({ x: p.x - nx, y: p.y - ny }));
      setVel((v) => ({ x: v.x + pushX, y: v.y + pushY }));
      setPeerVel((v) => ({ x: v.x - pushX, y: v.y - pushY }));
      sound.play('hit');
    }

    const meOut = checkOut({ x: nx, y: ny });
    const peerOut = checkOut(peerPosRef.current);
    if (meOut || peerOut) {
      if (meOut && !peerOut) finish(1);
      else if (peerOut && !meOut) finish(0);
      else finish(2);
      return;
    }

    animRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) window.cancelAnimationFrame(animRef.current); };
  }, []);

  useEffect(() => {
    if (isDemo) return;
    return store.onGameMove((move, _fromId) => {
      if (move.game !== 'sumo' || move.round !== round) return;
      if (move.payload?.type === 'pos') {
        setPeerPos({ x: move.payload.x as number, y: move.payload.y as number });
        setPeerVel({ x: move.payload.vx as number, y: move.payload.vy as number });
      }
    });
  }, [isDemo, round]);

  useEffect(() => {
    if (isDemo) return;
    const interval = window.setInterval(() => {
      store.sendGameMove({
        type: 'game-move',
        game: 'sumo',
        round,
        payload: { type: 'pos', x: posRef.current.x, y: posRef.current.y, vx: velRef.current.x, vy: velRef.current.y },
        fromId: meId,
      });
    }, 33);
    return () => window.clearInterval(interval);
  }, [isDemo, round, meId]);

  const handleKey = (e: KeyboardEvent, down: boolean) => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') { keysRef.current = { ...keysRef.current, up: down }; setKeys(keysRef.current); }
    if (k === 's' || k === 'arrowdown') { keysRef.current = { ...keysRef.current, down: down }; setKeys(keysRef.current); }
    if (k === 'a' || k === 'arrowleft') { keysRef.current = { ...keysRef.current, left: down }; setKeys(keysRef.current); }
    if (k === 'd' || k === 'arrowright') { keysRef.current = { ...keysRef.current, right: down }; setKeys(keysRef.current); }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => handleKey(e, true);
    const handleKeyUp = (e: KeyboardEvent) => handleKey(e, false);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const peerName = isDemo ? 'Daisy' : peer?.name ?? 'Friend';

  return (
    <div className="bg-sunset-arena flex h-full flex-col items-center justify-center gap-4 px-4">
      <div className="flex items-center gap-6 animate-slide-up">
        <span className="chip !border-[#ff8b94]/60 font-display text-sm text-cream">
          <span className="font-black text-[#ff6b7a]">P1</span> You
        </span>
        <span className="chip animate-floaty !border-daisy/60 font-display text-sm text-cream">Sumo Push</span>
        <span className="chip !border-[#74c7ff]/60 font-display text-sm text-cream">
          <span className="font-black text-[#6ec6ff]">P2</span> {peerName}
        </span>
      </div>

      <div className="relative" style={{ width: PAD_RADIUS * 2, height: PAD_RADIUS * 2 }}>
        <div className="absolute inset-0 rounded-full border-6 border-white/30 bg-gradient-to-br from-[#ff6b35] via-[#ff8c42] to-[#ffb347] shadow-[inset_0_-20px_40px_rgba(255,107,53,0.3),0_10px_0_rgba(42,26,85,0.4)]" />
        <div className="absolute inset-0 rounded-full border-2 border-daisy/30 pointer-events-none" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/20 pointer-events-none"
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ transform: `translate(${pos.x - CHAR_RADIUS * 1.25}px, ${pos.y - CHAR_RADIUS * 1.25}px)` }}
        >
          <Character
            color="red"
            state={Math.hypot(vel.x, vel.y) > 1 ? 'push' : 'idle'}
            facing={vel.x > 0 ? 'right' : 'left'}
            size={CHAR_RADIUS * 2.5}
          />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ transform: `translate(${peerPos.x - CHAR_RADIUS * 1.25}px, ${peerPos.y - CHAR_RADIUS * 1.25}px)` }}
        >
          <Character
            color="blue"
            state={Math.hypot(peerVel.x, peerVel.y) > 1 ? 'push' : 'idle'}
            facing={peerVel.x > 0 ? 'right' : 'left'}
            size={CHAR_RADIUS * 2.5}
          />
        </div>
      </div>

      <p className="text-xs font-bold text-white/50">
        {isDemo ? 'Arrow keys / WASD to push' : 'Arrow keys or WASD to move · Push opponent off the pad!'}
      </p>
    </div>
  );
}