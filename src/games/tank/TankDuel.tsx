import { useEffect, useRef, useState } from 'react';
import { getRoomStore } from '../../net/roomStore';
import { Character } from '../../components/characters/Character';
import { sound } from '../../audio/SoundManager';

interface TankDuelProps {
  isDemo: boolean;
  round: number;
  onEnd: (winner: 0 | 1 | 2) => void;
}

const ARENA_W = 360;
const ARENA_H = 260;
const TANK_R = 18;
const BULLET_R = 4;
const BULLET_SPEED = 10;
const MAX_SPEED = 3.5;
const FRICTION = 0.95;
const SHOOT_COOLDOWN = 600;
const MAX_HEALTH = 3;

interface Bullet { x: number; y: number; vx: number; vy: number; owner: string; }

export function TankDuel({ isDemo, round, onEnd }: TankDuelProps) {
  const store = getRoomStore();
  const snap = store.getSnapshot();
  const meId = snap.me.id;
  const peer = snap.room?.players.find((p) => p.id !== meId);

  const [pos, setPos] = useState({ x: -ARENA_W / 2 + 40, y: 0 });
  const [peerPos, setPeerPos] = useState({ x: ARENA_W / 2 - 40, y: 0 });
  const [angle, setAngle] = useState(0);
  const [peerAngle, setPeerAngle] = useState(Math.PI);
  const [vel, setVel] = useState({ x: 0, y: 0 });
  const [peerVel, setPeerVel] = useState({ x: 0, y: 0 });
  const [keys, setKeys] = useState({ up: false, down: false, left: false, right: false });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [peerBullets, setPeerBullets] = useState<Bullet[]>([]);
  const [health, setHealth] = useState(MAX_HEALTH);
  const [peerHealth, setPeerHealth] = useState(MAX_HEALTH);
  const [lastShot, setLastShot] = useState(0);
  const keysRef = useRef(keys);
  const posRef = useRef(pos);
  const peerPosRef = useRef(peerPos);
  const angleRef = useRef(angle);
  const velRef = useRef(vel);
  const peerVelRef = useRef(peerVel);
  const lastShotRef = useRef(lastShot);
  const animRef = useRef<number | null>(null);
  const endedRef = useRef(false);

  useEffect(() => { keysRef.current = keys; }, [keys]);
  useEffect(() => { posRef.current = pos; }, [pos]);
  useEffect(() => { peerPosRef.current = peerPos; }, [peerPos]);
  useEffect(() => { angleRef.current = angle; }, [angle]);
  useEffect(() => { velRef.current = vel; }, [vel]);
  useEffect(() => { peerVelRef.current = peerVel; }, [peerVel]);
  useEffect(() => { lastShotRef.current = lastShot; }, [lastShot]);

  const finish = (w: 0 | 1 | 2) => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (animRef.current) window.cancelAnimationFrame(animRef.current);
    window.setTimeout(() => onEnd(w), 800);
  };

  const step = () => {
    if (endedRef.current) return;

    let vx = velRef.current.x;
    let vy = velRef.current.y;

    if (keysRef.current.up) {
      vx += Math.cos(angleRef.current) * 0.15;
      vy += Math.sin(angleRef.current) * 0.15;
    }
    if (keysRef.current.down) {
      vx -= Math.cos(angleRef.current) * 0.08;
      vy -= Math.sin(angleRef.current) * 0.08;
    }
    if (keysRef.current.left) setAngle((a) => a - 0.06);
    if (keysRef.current.right) setAngle((a) => a + 0.06);

    const speed = Math.hypot(vx, vy);
    if (speed > MAX_SPEED) {
      vx = (vx / speed) * MAX_SPEED;
      vy = (vy / speed) * MAX_SPEED;
    }

    vx *= FRICTION;
    vy *= FRICTION;

    let nx = posRef.current.x + vx;
    let ny = posRef.current.y + vy;

    nx = Math.max(-ARENA_W / 2 + TANK_R, Math.min(ARENA_W / 2 - TANK_R, nx));
    ny = Math.max(-ARENA_H / 2 + TANK_R, Math.min(ARENA_H / 2 - TANK_R, ny));

    setPos({ x: nx, y: ny });
    setVel({ x: vx, y: vy });
    posRef.current = { x: nx, y: ny };
    velRef.current = { x: vx, y: vy };

    setBullets((prev) => {
      const next = prev.map((b) => ({
        ...b,
        x: b.x + b.vx,
        y: b.y + b.vy,
      })).filter((b) => {
        if (b.x < -ARENA_W / 2 || b.x > ARENA_W / 2 || b.y < -ARENA_H / 2 || b.y > ARENA_H / 2) return false;
        const dx = b.x - peerPosRef.current.x;
        const dy = b.y - peerPosRef.current.y;
        if (Math.hypot(dx, dy) < TANK_R + BULLET_R) {
          setPeerHealth((h) => {
            const nh = h - 1;
            if (nh <= 0) finish(0);
            return nh;
          });
          sound.play('hit');
          return false;
        }
        return true;
      });
      return next;
    });

    setPeerBullets((prev) => {
      const next = prev.map((b) => ({
        ...b,
        x: b.x + b.vx,
        y: b.y + b.vy,
      })).filter((b) => {
        if (b.x < -ARENA_W / 2 || b.x > ARENA_W / 2 || b.y < -ARENA_H / 2 || b.y > ARENA_H / 2) return false;
        const dx = b.x - posRef.current.x;
        const dy = b.y - posRef.current.y;
        if (Math.hypot(dx, dy) < TANK_R + BULLET_R) {
          setHealth((h) => {
            const nh = h - 1;
            if (nh <= 0) finish(1);
            return nh;
          });
          sound.play('hit');
          return false;
        }
        return true;
      });
      return next;
    });

    animRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) window.cancelAnimationFrame(animRef.current); };
  }, []);

  useEffect(() => {
    if (isDemo) return;
    return store.onGameMove((move, fromId) => {
      if (move.game !== 'tank' || move.round !== round) return;
      if (move.payload?.type === 'state') {
        setPeerPos({ x: move.payload.x as number, y: move.payload.y as number });
        setPeerAngle(move.payload.angle as number);
        setPeerVel({ x: move.payload.vx as number, y: move.payload.vy as number });
      } else if (move.payload?.type === 'shoot') {
        setPeerBullets((b) => [...b, { x: move.payload.x as number, y: move.payload.y as number, vx: move.payload.vx as number, vy: move.payload.vy as number, owner: fromId }]);
        sound.play('pop');
      }
    });
  }, [isDemo, round]);

  useEffect(() => {
    if (isDemo) return;
    const interval = window.setInterval(() => {
      store.sendGameMove({
        type: 'game-move',
        game: 'tank',
        round,
        payload: { type: 'state', x: posRef.current.x, y: posRef.current.y, angle: angleRef.current, vx: velRef.current.x, vy: velRef.current.y },
        fromId: meId,
      });
    }, 33);
    return () => window.clearInterval(interval);
  }, [isDemo, round, meId]);

  const handleShoot = () => {
    if (Date.now() - lastShotRef.current < SHOOT_COOLDOWN) { sound.play('hit'); return; }
    const vx = Math.cos(angleRef.current) * BULLET_SPEED;
    const vy = Math.sin(angleRef.current) * BULLET_SPEED;
    const bx = posRef.current.x + Math.cos(angleRef.current) * (TANK_R + BULLET_R);
    const by = posRef.current.y + Math.sin(angleRef.current) * (TANK_R + BULLET_R);
    setBullets((b) => [...b, { x: bx, y: by, vx, vy, owner: meId }]);
    setLastShot(Date.now());
    lastShotRef.current = Date.now();
    store.sendGameMove({
      type: 'game-move',
      game: 'tank',
      round,
      payload: { type: 'shoot', x: bx, y: by, vx, vy },
      fromId: meId,
    });
    sound.play('pop');
  };

  const handleKey = (e: KeyboardEvent, down: boolean) => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') { keysRef.current = { ...keysRef.current, up: down }; setKeys(keysRef.current); }
    if (k === 's' || k === 'arrowdown') { keysRef.current = { ...keysRef.current, down: down }; setKeys(keysRef.current); }
    if (k === 'a' || k === 'arrowleft') { keysRef.current = { ...keysRef.current, left: down }; setKeys(keysRef.current); }
    if (k === 'd' || k === 'arrowright') { keysRef.current = { ...keysRef.current, right: down }; setKeys(keysRef.current); }
    if ((k === ' ' || k === 'enter') && down) handleShoot();
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
    <div className="bg-sky-arena flex h-full flex-col items-center justify-center gap-4 px-4">
      <div className="flex items-center gap-6 animate-slide-up">
        <span className="chip !border-[#ff8b94]/60 font-display text-sm text-cream">
          <span className="font-black text-[#ff6b7a]">P1</span> You
        </span>
        <span className="chip animate-floaty !border-daisy/60 font-display text-sm text-cream">Tank Duel</span>
        <span className="chip !border-[#74c7ff]/60 font-display text-sm text-cream">
          <span className="font-black text-[#6ec6ff]">P2</span> {peerName}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm font-bold text-white/80">
        <span className="chip">❤️ × {health}</span>
        <span className="chip !border-daisy/60">VS</span>
        <span className="chip">❤️ × {peerHealth}</span>
      </div>

      <div className="relative" style={{ width: ARENA_W, height: ARENA_H }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#2c5282] to-[#1e3a5f] rounded-2xl border-4 border-white/20 shadow-[inset_0_-30px_60px_rgba(30,58,95,0.5),0_10px_0_rgba(42,26,85,0.4)]" />
        <div className="absolute inset-0 rounded-2xl border-2 border-white/20 pointer-events-none" />

        {bullets.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-red shadow-[0_0_6px_rgba(255,50,50,0.8)] pointer-events-none"
            style={{
              left: `${b.x + ARENA_W / 2 - BULLET_R}px`,
              top: `${b.y + ARENA_H / 2 - BULLET_R}px`,
              width: BULLET_R * 2,
              height: BULLET_R * 2,
            }}
          />
        ))}
        {peerBullets.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue shadow-[0_0_6px_rgba(50,100,255,0.8)] pointer-events-none"
            style={{
              left: `${b.x + ARENA_W / 2 - BULLET_R}px`,
              top: `${b.y + ARENA_H / 2 - BULLET_R}px`,
              width: BULLET_R * 2,
              height: BULLET_R * 2,
            }}
          />
        ))}

        <div
          className="absolute"
          style={{
            position: 'absolute',
            left: `${pos.x + ARENA_W / 2 - TANK_R * 1.4}px`,
            top: `${pos.y + ARENA_H / 2 - TANK_R * 1.4}px`,
            transform: `rotate(${angle}rad)`,
            transformOrigin: 'center',
          }}
        >
          <Character
            color="red"
            state={Math.hypot(vel.x, vel.y) > 0.3 ? 'run' : 'idle'}
            facing={Math.cos(angle) > 0 ? 'right' : 'left'}
            size={TANK_R * 2.8}
          />
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-4 bg-yellow/80 rounded" />
        </div>
        <div
          className="absolute"
          style={{
            position: 'absolute',
            left: `${peerPos.x + ARENA_W / 2 - TANK_R * 1.4}px`,
            top: `${peerPos.y + ARENA_H / 2 - TANK_R * 1.4}px`,
            transform: `rotate(${peerAngle}rad)`,
            transformOrigin: 'center',
          }}
        >
          <Character
            color="blue"
            state={Math.hypot(peerVel.x, peerVel.y) > 0.3 ? 'run' : 'idle'}
            facing={Math.cos(peerAngle) > 0 ? 'right' : 'left'}
            size={TANK_R * 2.8}
          />
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-4 bg-yellow/80 rounded" />
        </div>
      </div>

      <p className="text-xs font-bold text-white/50">
        {isDemo ? 'WASD/Arrows to move/aim · Space/Enter to shoot' : 'Move: WASD/Arrows · Aim: Mouse · Shoot: Space/Enter · 3 hits to win!'}
      </p>
    </div>
  );
}