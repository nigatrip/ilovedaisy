import { useEffect, useRef, useState } from 'react';
import { getRoomStore } from '../../net/roomStore';
import { Character } from '../../components/characters/Character';
import { sound } from '../../audio/SoundManager';

interface TugOfWarProps {
  isDemo: boolean;
  round: number;
  onEnd: (winner: 0 | 1 | 2) => void;
}

const ROPE_LENGTH = 320;
const WIN_ZONE = 60;
const PULL_SPEED = 1.8;
const FRICTION = 0.95;
const MAX_SPEED = 4;

export function TugOfWar({ isDemo, round, onEnd }: TugOfWarProps) {
  const store = getRoomStore();
  const snap = store.getSnapshot();
  const meId = snap.me.id;
  const myPlayer = snap.myPlayer;
  const peer = snap.room?.players.find((p) => p.id !== meId);

  const [ropeX, setRopeX] = useState(0);
  const [vel, setVel] = useState(0);
  const [pulling, setPulling] = useState(false);
  const animRef = useRef<number | null>(null);
  const endedRef = useRef(false);

  const finish = (w: 0 | 1 | 2) => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (animRef.current) window.cancelAnimationFrame(animRef.current);
    window.setTimeout(() => onEnd(w), 800);
  };

  const step = () => {
    if (endedRef.current) return;

    let v = vel;
    v *= FRICTION;

    if (pulling) {
      const myDir = myPlayer?.role === 'host' ? -1 : 1;
      v += myDir * PULL_SPEED;
    }

    if (v > MAX_SPEED) v = MAX_SPEED;
    if (v < -MAX_SPEED) v = -MAX_SPEED;

    let nx = ropeX + v;
    if (nx < -ROPE_LENGTH / 2) nx = -ROPE_LENGTH / 2;
    if (nx > ROPE_LENGTH / 2) nx = ROPE_LENGTH / 2;

    setRopeX(nx);
    setVel(v);

    if (nx <= -ROPE_LENGTH / 2 + WIN_ZONE) {
      finish(myPlayer?.role === 'host' ? 0 : 1);
      return;
    }
    if (nx >= ROPE_LENGTH / 2 - WIN_ZONE) {
      finish(myPlayer?.role === 'host' ? 1 : 0);
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
      if (move.game !== 'tug' || move.round !== round) return;
      if (move.payload?.type === 'pull') {
        setPeerPulling(move.payload.pulling as boolean);
      }
    });
  }, [isDemo, round]);

  const [peerPulling, setPeerPulling] = useState(false);

  useEffect(() => {
    if (isDemo) return;
    const interval = window.setInterval(() => {
      store.sendGameMove({
        type: 'game-move',
        game: 'tug',
        round,
        payload: { type: 'pull', pulling },
        fromId: meId,
      });
    }, 50);
    return () => window.clearInterval(interval);
  }, [isDemo, round, pulling, meId]);

  const handleKey = (e: KeyboardEvent, down: boolean) => {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      setPulling(down);
      if (down) sound.play('pop');
    }
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

  const markerX = ropeX + ROPE_LENGTH / 2;

  return (
    <div className="bg-grape-arena flex h-full flex-col items-center justify-center gap-4 px-4">
      <div className="flex items-center gap-6 animate-slide-up">
        <span className="chip !border-[#ff8b94]/60 font-display text-sm text-cream">
          <span className="font-black text-[#ff6b7a]">P1</span> You
        </span>
        <span className="chip animate-floaty !border-daisy/60 font-display text-sm text-cream">Tug of War</span>
        <span className="chip !border-[#74c7ff]/60 font-display text-sm text-cream">
          <span className="font-black text-[#6ec6ff]">P2</span> {peerName}
        </span>
      </div>

      <div className="relative" style={{ width: ROPE_LENGTH, height: 120 }}>
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-white/30 to-transparent -translate-x-1/2" />
        <div className="absolute left-0 top-0 bottom-0 w-[60px] bg-gradient-to-r from-red/30 to-transparent rounded-r-full" />
        <div className="absolute right-0 top-0 bottom-0 w-[60px] bg-gradient-to-l from-blue/30 to-transparent rounded-l-full" />

        <div className="absolute top-0 bottom-0 h-8 bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] rounded-full shadow-[0_4px_0_rgba(139,92,246,0.6),0_8px_16px_rgba(0,0,0,0.4)]"
          style={{ left: `${markerX - 4}px`, transform: 'translateY(-50%)', top: '50%' }}
        >
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <span className="font-display text-xs text-white/80">●</span>
          </div>
        </div>

        <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}>
          <Character
            color="red"
            state={pulling ? 'pull' : 'idle'}
            facing="right"
            size={80}
          />
        </div>
        <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
          <Character
            color="blue"
            state={peerPulling ? 'pull' : 'idle'}
            facing="left"
            size={80}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-red to-blue rounded-full transition-all duration-100"
            style={{ width: `${((markerX / ROPE_LENGTH) * 100)}%` }}
          />
        </div>
      </div>

      <p className="text-xs font-bold text-white/50">
        {isDemo ? 'Space / ArrowUp / W to pull' : 'Hold Space / ArrowUp / W to pull the rope!'}
      </p>
    </div>
  );
}