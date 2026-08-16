import { useEffect, useRef, useState } from 'react';
import { getRoomStore } from '../../net/roomStore';
import { Character } from '../../components/characters/Character';
import { sound } from '../../audio/SoundManager';

interface MiniFootballProps {
  isDemo: boolean;
  round: number;
  onEnd: (winner: 0 | 1 | 2) => void;
}

const FIELD_W = 360;
const FIELD_H = 220;
const GOAL_H = 80;
const BALL_R = 10;
const PLAYER_R = 18;
const MAX_SPEED = 5;
const FRICTION = 0.94;
const KICK_POWER = 14;
const KICK_COOLDOWN = 400;

export function MiniFootball({ isDemo, round, onEnd }: MiniFootballProps) {
  const store = getRoomStore();
  const snap = store.getSnapshot();
  const meId = snap.me.id;
  const peer = snap.room?.players.find((p) => p.id !== meId);

  const [pos, setPos] = useState({ x: -FIELD_W / 2 + 50, y: 0 });
  const [peerPos, setPeerPos] = useState({ x: FIELD_W / 2 - 50, y: 0 });
  const [ball, setBall] = useState({ x: 0, y: 0, vx: 0, vy: 0 });
  const [vel, setVel] = useState({ x: 0, y: 0 });
  const [peerVel, setPeerVel] = useState({ x: 0, y: 0 });
  const [keys, setKeys] = useState({ up: false, down: false, left: false, right: false });
  const [lastKick, setLastKick] = useState(0);
  const [score, setScore] = useState({ me: 0, peer: 0 });
  const animRef = useRef<number | null>(null);
  const endedRef = useRef(false);

  const finish = (w: 0 | 1 | 2) => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (animRef.current) window.cancelAnimationFrame(animRef.current);
    window.setTimeout(() => onEnd(w), 800);
  };

  const resetBall = (scorer: 'me' | 'peer') => {
    setBall({ x: 0, y: 0, vx: 0, vy: 0 });
    setScore((s) => ({ ...s, [scorer]: s[scorer] + 1 }));
    if (scorer === 'me') {
      if (score.me + 1 >= 2) { finish(0); return; }
    } else {
      if (score.peer + 1 >= 2) { finish(1); return; }
    }
    setPos({ x: -FIELD_W / 2 + 50, y: 0 });
    setPeerPos({ x: FIELD_W / 2 - 50, y: 0 });
  };

  const checkGoal = (bx: number) => {
    if (bx <= -FIELD_W / 2 + BALL_R && Math.abs(ball.y) < GOAL_H / 2) return 'peer';
    if (bx >= FIELD_W / 2 - BALL_R && Math.abs(ball.y) < GOAL_H / 2) return 'me';
    return null;
  };

  const step = () => {
    if (endedRef.current) return;

    let vx = vel.x;
    let vy = vel.y;

    if (keys.up) vy -= 0.3;
    if (keys.down) vy += 0.3;
    if (keys.left) vx -= 0.3;
    if (keys.right) vx += 0.3;

    const speed = Math.hypot(vx, vy);
    if (speed > MAX_SPEED) {
      vx = (vx / speed) * MAX_SPEED;
      vy = (vy / speed) * MAX_SPEED;
    }

    vx *= FRICTION;
    vy *= FRICTION;

    let nx = pos.x + vx;
    let ny = pos.y + vy;

    nx = Math.max(-FIELD_W / 2 + PLAYER_R, Math.min(FIELD_W / 2 - PLAYER_R, nx));
    ny = Math.max(-FIELD_H / 2 + PLAYER_R, Math.min(FIELD_H / 2 - PLAYER_R, ny));

    const dx = ball.x - nx;
    const dy = ball.y - ny;
    const d = Math.hypot(dx, dy);
    if (d < PLAYER_R + BALL_R && d > 0.1) {
      const overlap = (PLAYER_R + BALL_R - d) / 2;
      const pushX = (dx / d) * overlap;
      const pushY = (dy / d) * overlap;
      nx -= pushX;
      ny -= pushY;
    }

    setPos({ x: nx, y: ny });
    setVel({ x: vx, y: vy });

    let bx = ball.x + ball.vx;
    let by = ball.y + ball.vy;
    let bvx = ball.vx * 0.985;
    let bvy = ball.vy * 0.985;

    if (by <= -FIELD_H / 2 + BALL_R || by >= FIELD_H / 2 - BALL_R) {
      by = Math.max(-FIELD_H / 2 + BALL_R, Math.min(FIELD_H / 2 - BALL_R, by));
      bvy *= -0.6;
    }
    if (bx <= -FIELD_W / 2 + BALL_R) {
      bx = -FIELD_W / 2 + BALL_R;
      bvx *= -0.6;
    }
    if (bx >= FIELD_W / 2 - BALL_R) {
      bx = FIELD_W / 2 - BALL_R;
      bvx *= -0.6;
    }

    const pdx = bx - nx;
    const pdy = by - ny;
    const pd = Math.hypot(pdx, pdy);
    if (pd < PLAYER_R + BALL_R && pd > 0.1) {
      const overlap = (PLAYER_R + BALL_R - pd) / 2;
      bx += (pdx / pd) * overlap;
      by += (pdy / pd) * overlap;
      bvx = (pdx / pd) * Math.max(Math.hypot(bvx, bvy), 3);
      bvy = (pdy / pd) * Math.max(Math.hypot(bvx, bvy), 3);
      sound.play('hit');
    }

    const p2dx = bx - peerPos.x;
    const p2dy = by - peerPos.y;
    const p2d = Math.hypot(p2dx, p2dy);
    if (p2d < PLAYER_R + BALL_R && p2d > 0.1) {
      const overlap = (PLAYER_R + BALL_R - p2d) / 2;
      bx -= (p2dx / p2d) * overlap;
      by -= (p2dy / p2d) * overlap;
      bvx = -(p2dx / p2d) * Math.max(Math.hypot(bvx, bvy), 3);
      bvy = -(p2dy / p2d) * Math.max(Math.hypot(bvx, bvy), 3);
      sound.play('hit');
    }

    setBall({ x: bx, y: by, vx: bvx, vy: bvy });

    const goal = checkGoal(bx);
    if (goal) {
      resetBall(goal);
      sound.play(goal === 'me' ? 'win' : 'lose');
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
      if (move.game !== 'football' || move.round !== round) return;
      if (move.payload?.type === 'state') {
        setPeerPos({ x: move.payload.x as number, y: move.payload.y as number });
        setPeerVel({ x: move.payload.vx as number, y: move.payload.vy as number });
      } else if (move.payload?.type === 'kick') {
        setBall((b) => ({ ...b, vx: move.payload.vx as number, vy: move.payload.vy as number }));
        sound.play('hit');
      }
    });
  }, [isDemo, round]);

  useEffect(() => {
    if (isDemo) return;
    const interval = window.setInterval(() => {
      store.sendGameMove({
        type: 'game-move',
        game: 'football',
        round,
        payload: { type: 'state', x: pos.x, y: pos.y, vx: vel.x, vy: vel.y },
        fromId: meId,
      });
    }, 33);
    return () => window.clearInterval(interval);
  }, [isDemo, round, pos, vel, meId]);

  useEffect(() => {
    if (isDemo) return;
    const interval = window.setInterval(() => {
      store.sendGameMove({
        type: 'game-move',
        game: 'football',
        round,
        payload: { type: 'ball', x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy },
        fromId: meId,
      });
    }, 33);
    return () => window.clearInterval(interval);
  }, [isDemo, round, ball, meId]);

  const canKick = () => {
    const dx = ball.x - pos.x;
    const dy = ball.y - pos.y;
    return Math.hypot(dx, dy) < PLAYER_R + BALL_R + 5 && Date.now() - lastKick > KICK_COOLDOWN;
  };

  const handleKick = () => {
    if (!canKick()) { sound.play('hit'); return; }
    const dx = ball.x - pos.x;
    const dy = ball.y - pos.y;
    const d = Math.hypot(dx, dy) || 1;
    const kvx = (dx / d) * KICK_POWER;
    const kvy = (dy / d) * KICK_POWER;

    setBall((b) => ({ ...b, vx: kvx, vy: kvy }));
    setLastKick(Date.now());
    store.sendGameMove({
      type: 'game-move',
      game: 'football',
      round,
      payload: { type: 'kick', vx: kvx, vy: kvy },
      fromId: meId,
    });
    sound.play('pop');
  };

  const handleKey = (e: KeyboardEvent, down: boolean) => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') setKeys((s) => ({ ...s, up: down }));
    if (k === 's' || k === 'arrowdown') setKeys((s) => ({ ...s, down: down }));
    if (k === 'a' || k === 'arrowleft') setKeys((s) => ({ ...s, left: down }));
    if (k === 'd' || k === 'arrowright') setKeys((s) => ({ ...s, right: down }));
    if ((k === ' ' || k === 'enter') && down) handleKick();
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
    <div className="bg-mint-arena flex h-full flex-col items-center justify-center gap-4 px-4">
      <div className="flex items-center gap-6 animate-slide-up">
        <span className="chip !border-[#ff8b94]/60 font-display text-sm text-cream">
          <span className="font-black text-[#ff6b7a]">P1</span> You
        </span>
        <span className="chip animate-floaty !border-daisy/60 font-display text-sm text-cream">Mini Football</span>
        <span className="chip !border-[#74c7ff]/60 font-display text-sm text-cream">
          <span className="font-black text-[#6ec6ff]">P2</span> {peerName}
        </span>
      </div>

      <div className="relative" style={{ width: FIELD_W, height: FIELD_H }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a7f3d] via-[#228b45] to-[#1a7f3d] rounded-2xl border-4 border-white/20 shadow-[inset_0_-30px_60px_rgba(26,127,61,0.4),0_10px_0_rgba(42,26,85,0.4)]" />
        <div className="absolute inset-0 rounded-2xl border-2 border-white/20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-full bg-white/30 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-white/30 pointer-events-none" />

        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-[80px] bg-white/40" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[4px] h-[80px] bg-white/40" />
        <div className="absolute left-[4px] top-1/2 -translate-y-1/2 w-[12px] h-[80px] bg-gradient-to-r from-red/40 to-transparent rounded-r-full pointer-events-none" />
        <div className="absolute right-[16px] top-1/2 -translate-y-1/2 w-[12px] h-[80px] bg-gradient-to-l from-blue/40 to-transparent rounded-l-full pointer-events-none" />

        <div
          className="absolute rounded-full bg-white border-2 border-white/30 shadow-[0_3px_0_rgba(0,0,0,0.4)] pointer-events-none"
          style={{
            left: `${ball.x + FIELD_W / 2 - BALL_R}px`,
            top: `${ball.y + FIELD_H / 2 - BALL_R}px`,
            width: BALL_R * 2,
            height: BALL_R * 2,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-black text-[10px]">●</div>
        </div>

        <div className="absolute"
          style={{ left: `${pos.x + FIELD_W / 2 - PLAYER_R * 1.1}px`, top: `${pos.y + FIELD_H / 2 - PLAYER_R * 1.1}px` }}
        >
          <Character
            color="red"
            state={Math.hypot(vel.x, vel.y) > 0.5 ? 'run' : 'idle'}
            facing={vel.x > 0 ? 'right' : 'left'}
            size={PLAYER_R * 2.2}
          />
        </div>
        <div className="absolute"
          style={{ left: `${peerPos.x + FIELD_W / 2 - PLAYER_R * 1.1}px`, top: `${peerPos.y + FIELD_H / 2 - PLAYER_R * 1.1}px` }}
        >
          <Character
            color="blue"
            state={Math.hypot(peerVel.x, peerVel.y) > 0.5 ? 'run' : 'idle'}
            facing={peerVel.x > 0 ? 'right' : 'left'}
            size={PLAYER_R * 2.2}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm font-bold text-white/80">
        <span className="chip">{score.me}</span>
        <span className="chip !border-daisy/60">VS</span>
        <span className="chip">{score.peer}</span>
      </div>

      <p className="text-xs font-bold text-white/50">
        {isDemo ? 'Arrow keys / WASD to move · Space/Enter to kick' : 'Move: Arrows/WASD · Kick: Space/Enter · First to 2 goals wins!'}
      </p>
    </div>
  );
}