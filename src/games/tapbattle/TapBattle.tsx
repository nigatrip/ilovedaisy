import { useEffect, useRef, useState } from 'react';
import { getRoomStore } from '../../net/roomStore';
import { sound } from '../../audio/SoundManager';

interface TapBattleProps {
  isDemo: boolean;
  round: number;
  onEnd: (winner: 0 | 1 | 2) => void;
}

const DURATION = 10000;
const TAP_POWER = 1.5;
const DECAY = 0.995;

export function TapBattle({ isDemo, round, onEnd }: TapBattleProps) {
  const store = getRoomStore();
  const snap = store.getSnapshot();
  const meId = snap.me.id;
  const peer = snap.room?.players.find((p) => p.id !== meId);

  const [score, setScore] = useState(0);
  const [peerScore, setPeerScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [winner, setWinner] = useState<0 | 1 | 2 | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);
  const scoreRef = useRef(score);
  const peerScoreRef = useRef(peerScore);
  const startedRef = useRef(started);
  const animRef = useRef<number | null>(null);
  const endedRef = useRef(false);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { peerScoreRef.current = peerScore; }, [peerScore]);
  useEffect(() => { startedRef.current = started; }, [started]);

  const finish = (w: 0 | 1 | 2) => {
    if (endedRef.current) return;
    endedRef.current = true;
    setWinner(w);
    if (animRef.current) window.cancelAnimationFrame(animRef.current);
    window.setTimeout(() => onEnd(w), 800);
  };

  const tap = () => {
    if (!startedRef.current || endedRef.current) return;
    setScore((s) => {
      const ns = s + TAP_POWER;
      if (ns >= 100) finish(0);
      scoreRef.current = ns;
      return ns;
    });
    sound.play('pop');
    store.sendGameMove({
      type: 'game-move',
      game: 'tapbattle',
      round,
      payload: { type: 'tap', score: scoreRef.current + TAP_POWER },
      fromId: meId,
    });
  };

  useEffect(() => {
    const t = window.setTimeout(() => setCountdown(2), 1000);
    const t2 = window.setTimeout(() => setCountdown(1), 2000);
    const t3 = window.setTimeout(() => {
      setCountdown(0);
      setStarted(true);
    }, 3000);
    return () => { window.clearTimeout(t); window.clearTimeout(t2); window.clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (!started || endedRef.current) return;
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) window.cancelAnimationFrame(animRef.current); };
  }, [started]);

  const tick = () => {
    if (endedRef.current) return;

    setTimeLeft((t) => {
      const nt = t - 16;
      if (nt <= 0) {
        finish(scoreRef.current > peerScoreRef.current ? 0 : peerScoreRef.current > scoreRef.current ? 1 : 2);
        return 0;
      }
      return nt;
    });

    setScore((s) => Math.max(0, s * DECAY));
    setPeerScore((s) => Math.max(0, s * DECAY));
    scoreRef.current = Math.max(0, scoreRef.current * DECAY);
    peerScoreRef.current = Math.max(0, peerScoreRef.current * DECAY);

    if (scoreRef.current >= 100) finish(0);
    else if (peerScoreRef.current >= 100) finish(1);
    else animRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (isDemo) return;
    return store.onGameMove((move, _fromId) => {
      if (move.game !== 'tapbattle' || move.round !== round) return;
      if (move.payload?.type === 'tap') setPeerScore(move.payload.score as number);
    });
  }, [isDemo, round]);

  useEffect(() => {
    if (isDemo) return;
    const interval = window.setInterval(() => {
      store.sendGameMove({
        type: 'game-move',
        game: 'tapbattle',
        round,
        payload: { type: 'sync', score: scoreRef.current },
        fromId: meId,
      });
    }, 100);
    return () => window.clearInterval(interval);
  }, [isDemo, round, meId]);

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      tap();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => handleKey(e);
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    tap();
  };

  const peerName = isDemo ? 'Daisy' : peer?.name ?? 'Friend';

  return (
    <div className="bg-sunset-arena flex h-full flex-col items-center justify-center gap-4 px-4" onClick={handleClick}>
      <div className="flex items-center gap-6 animate-slide-up">
        <span className="chip !border-[#ff8b94]/60 font-display text-sm text-cream">
          <span className="font-black text-[#ff6b7a]">P1</span> You
        </span>
        <span className="chip animate-floaty !border-daisy/60 font-display text-sm text-cream">Tap Battle</span>
        <span className="chip !border-[#74c7ff]/60 font-display text-sm text-cream">
          <span className="font-black text-[#6ec6ff]">P2</span> {peerName}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-64 h-4 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-red to-daisy rounded-full transition-all duration-100"
            style={{ width: `${(score / 100) * 100}%` }}
          />
        </div>
        <span className="chip !border-daisy/60 font-display text-lg">VS</span>
        <div className="w-64 h-4 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-l from-blue to-lime rounded-full transition-all duration-100"
            style={{ width: `${(peerScore / 100) * 100}%` }}
          />
        </div>
      </div>

      <div className="relative w-72 h-72">
        <div className="absolute inset-0 rounded-full border-8 border-white/10" />
        <div className="absolute inset-0 rounded-full border-8 border-daisy/30"
          style={{ clipPath: `polygon(50% 50%, 50% 0, ${50 + Math.sin(-Math.PI / 2) * 50}% ${50 + Math.cos(-Math.PI / 2) * 50}%)` }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {countdown > 0 ? (
            <span className="font-display text-7xl text-daisy text-outline animate-pop">{countdown}</span>
          ) : started ? (
            <span className="font-display text-5xl text-cream text-outline">{Math.ceil(timeLeft / 1000)}s</span>
          ) : (
            <span className="font-display text-5xl text-cream text-outline">Get Ready!</span>
          )}
          <div className="mt-4 text-sm font-bold text-white/70">Tap anywhere or press Space/Enter/ArrowUp</div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm font-bold text-white/80">
        <span className="chip">Score: {Math.floor(score)}</span>
        <span className="chip !border-daisy/60">VS</span>
        <span className="chip">Score: {Math.floor(peerScore)}</span>
      </div>

      {winner !== null && (
        <div className="animate-pop fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="bg-arena rounded-3xl p-8 text-center">
            <div className="font-display text-4xl text-cream text-outline mb-4">
              {winner === 0 ? 'You win!' : winner === 2 ? "It's a draw!" : 'Round lost'}
            </div>
            <button
              className="arcade-btn arcade-btn--daisy px-6 py-3 text-lg"
              onClick={() => { /* handled by GameScreen */ }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <p className="text-xs font-bold text-white/50">
        {isDemo ? 'Tap or press Space/Enter/ArrowUp rapidly' : 'Tap screen or press Space/Enter/ArrowUp rapidly · Highest score after 10s wins!'}
      </p>
    </div>
  );
}