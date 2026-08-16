import { useEffect, useRef, useState } from 'react';
import { getRoomStore } from '../../net/roomStore';
import { Character } from '../../components/characters/Character';
import { sound } from '../../audio/SoundManager';

interface MicroRaceProps {
  isDemo: boolean;
  round: number;
  onEnd: (winner: 0 | 1 | 2) => void;
}

const TRACK_W = 400;
const TRACK_H = 200;
const LANE_COUNT = 3;
const LANE_H = TRACK_H / LANE_COUNT;
const CAR_W = 44;
const CAR_H = 24;
const MAX_SPEED = 7;
const ACCEL = 0.25;
const BRAKE = 0.4;
const FRICTION = 0.96;
const LAP_DIST = TRACK_W * 2;

export function MicroRace({ isDemo, round, onEnd }: MicroRaceProps) {
  const store = getRoomStore();
  const snap = store.getSnapshot();
  const meId = snap.me.id;
  const peer = snap.room?.players.find((p) => p.id !== meId);

  const [vel, setVel] = useState(0);
  const [peerVel, setPeerVel] = useState(0);
  const [lane, setLane] = useState(0);
  const [peerLane, setPeerLane] = useState(LANE_COUNT - 1);
  const [dist, setDist] = useState(0);
  const [peerDist, setPeerDist] = useState(0);
  const [keys, setKeys] = useState({ up: false, down: false, left: false, right: false });
  const animRef = useRef<number | null>(null);
  const endedRef = useRef(false);

  const finish = (w: 0 | 1 | 2) => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (animRef.current) window.cancelAnimationFrame(animRef.current);
    window.setTimeout(() => onEnd(w), 800);
  };

  const laneY = (l: number) => -TRACK_H / 2 + l * LANE_H + LANE_H / 2;

  const step = () => {
    if (endedRef.current) return;

    let v = vel;
    if (keys.up) v = Math.min(v + ACCEL, MAX_SPEED);
    if (keys.down) v = Math.max(v - BRAKE, -MAX_SPEED * 0.4);
    v *= FRICTION;

    let ndist = dist + v;
    if (ndist >= LAP_DIST) {
      finish(0);
      return;
    }

    setDist(ndist);
    setVel(v);

    if (keys.left && lane > 0) setLane((l) => l - 1);
    if (keys.right && lane < LANE_COUNT - 1) setLane((l) => l + 1);

    const dx = peerDist - dist;
    if (Math.abs(dx) < 30 && lane === peerLane && peerVel > v - 1) {
      setVel((v) => Math.max(v - 1, 0));
      sound.play('hit');
    }

    if (peerDist >= LAP_DIST) {
      finish(1);
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
      if (move.game !== 'race' || move.round !== round) return;
      if (move.payload?.type === 'state') {
        setPeerVel(move.payload.vel as number);
        setPeerDist(move.payload.dist as number);
        setPeerLane(move.payload.lane as number);
      }
    });
  }, [isDemo, round]);

  useEffect(() => {
    if (isDemo) return;
    const interval = window.setInterval(() => {
      store.sendGameMove({
        type: 'game-move',
        game: 'race',
        round,
        payload: { type: 'state', vel, dist, lane },
        fromId: meId,
      });
    }, 33);
    return () => window.clearInterval(interval);
  }, [isDemo, round, vel, dist, lane, meId]);

  const handleKey = (e: KeyboardEvent, down: boolean) => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') setKeys((s) => ({ ...s, up: down }));
    if (k === 's' || k === 'arrowdown') setKeys((s) => ({ ...s, down: down }));
    if (k === 'a' || k === 'arrowleft') setKeys((s) => ({ ...s, left: down }));
    if (k === 'd' || k === 'arrowright') setKeys((s) => ({ ...s, right: down }));
  };

  useEffect(() => {
    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));
    return () => {
      window.removeEventListener('keydown', (e) => handleKey(e, true));
      window.removeEventListener('keyup', (e) => handleKey(e, false));
    };
  }, []);

  const peerName = isDemo ? 'Daisy' : peer?.name ?? 'Friend';

  const myX = ((dist % TRACK_W) - TRACK_W / 2);
  const peerX = ((peerDist % TRACK_W) - TRACK_W / 2);

  return (
    <div className="bg-sky-arena flex h-full flex-col items-center justify-center gap-4 px-4">
      <div className="flex items-center gap-6 animate-slide-up">
        <span className="chip !border-[#ff8b94]/60 font-display text-sm text-cream">
          <span className="font-black text-[#ff6b7a]">P1</span> You
        </span>
        <span className="chip animate-floaty !border-daisy/60 font-display text-sm text-cream">Micro Race</span>
        <span className="chip !border-[#74c7ff]/60 font-display text-sm text-cream">
          <span className="font-black text-[#6ec6ff]">P2</span> {peerName}
        </span>
      </div>

      <div className="relative" style={{ width: TRACK_W, height: TRACK_H }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] rounded-2xl border-4 border-white/20 shadow-[inset_0_-30px_60px_rgba(0,0,0,0.6),0_10px_0_rgba(42,26,85,0.4)]" />
        <div className="absolute inset-0 rounded-2xl border-2 border-white/20 pointer-events-none" />

        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(255,255,255,0.15)_40px,rgba(255,255,255,0.15)_80px)] pointer-events-none" />

        {Array.from({ length: LANE_COUNT - 1 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-[2px] bg-white/20 pointer-events-none"
            style={{ top: `${-TRACK_H / 2 + (i + 1) * LANE_H}px` }}
          />
        ))}

        <div className="absolute left-0 right-0 h-[4px] bg-gradient-to-r from-daisy to-lime pointer-events-none" style={{ top: `${-TRACK_H / 2 - 4}px` }} />
        <div className="absolute left-0 right-0 h-[4px] bg-gradient-to-r from-daisy to-lime pointer-events-none" style={{ bottom: `-4px` }} />

        <div className="absolute"
          style={{ left: `${myX + TRACK_W / 2 - CAR_W / 2}px`, top: `${laneY(lane) - CAR_H / 2}px` }}
        >
          <Character
            color="red"
            state={vel > 1 ? 'run' : 'idle'}
            facing="right"
            size={CAR_H * 1.8}
          />
        </div>
        <div className="absolute"
          style={{ left: `${peerX + TRACK_W / 2 - CAR_W / 2}px`, top: `${laneY(peerLane) - CAR_H / 2}px` }}
        >
          <Character
            color="blue"
            state={peerVel > 1 ? 'run' : 'idle'}
            facing="right"
            size={CAR_H * 1.8}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm font-bold text-white/80">
        <span className="chip">Lap {Math.floor(dist / TRACK_W) + 1}</span>
        <span className="chip !border-daisy/60">VS</span>
        <span className="chip">Lap {Math.floor(peerDist / TRACK_W) + 1}</span>
      </div>

      <p className="text-xs font-bold text-white/50">
        {isDemo ? 'Arrow keys / WASD to accelerate/turn' : 'Up/W: Accelerate · Down/S: Brake · Left/Right/A/D: Change lane · First lap wins!'}
      </p>
    </div>
  );
}