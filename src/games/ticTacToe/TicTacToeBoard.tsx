import { useEffect, useRef, useState } from 'react';
import { getRoomStore } from '../../net/roomStore';
import { sound } from '../../audio/SoundManager';

type Sym = 'X' | 'O';
type Cell = Sym | null;

interface TicTacToeProps {
  isDemo: boolean;
  round: number;
  onEnd: (winner: 0 | 1 | 2) => void;
}

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function evaluate(cells: Cell[]): { winner: Sym | null; draw: boolean } {
  for (const [a, b, c] of LINES) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return { winner: cells[a], draw: false };
    }
  }
  return { winner: null, draw: cells.every(Boolean) };
}

function aiPick(cells: Cell[], ai: Sym, me: Sym): number {
  const empty = cells.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  if (empty.length === 0) return -1;
  const win = (sym: Sym) => {
    for (const cell of empty) {
      const trial = [...cells];
      trial[cell] = sym;
      if (evaluate(trial).winner === sym) return cell;
    }
    return -1;
  };
  const w = win(ai);
  if (w >= 0) return w;
  const b = win(me);
  if (b >= 0) return b;
  if (cells[4] === null) return 4;
  const corners = [0, 2, 6, 8].filter((i) => cells[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

export function TicTacToeBoard({ isDemo, round, onEnd }: TicTacToeProps) {
  const store = getRoomStore();
  const snap = store.getSnapshot();
  const meId = snap.me.id;
  const mySym: Sym = isDemo || snap.isHost ? 'X' : 'O';
  const peerName = isDemo
    ? 'Daisy'
    : (snap.room?.players.find((p) => p.id !== meId)?.name ?? 'Friend');

  const [cells, setCells] = useState<Cell[]>(Array(9).fill(null));
  const endedRef = useRef(false);
  const ended = endedRef.current;

  const moves = cells.filter(Boolean).length;
  const { winner, draw } = evaluate(cells);
  const myTurn = !winner && !draw && (moves % 2 === 0) === (mySym === 'X');

  const finish = (w: Sym | null, isDraw: boolean) => {
    if (endedRef.current) return;
    endedRef.current = true;
    const result: 0 | 1 | 2 = isDraw ? 2 : w === 'X' ? 0 : 1;
    window.setTimeout(() => onEnd(result), 900);
  };

  const applyMove = (cell: number, sym: Sym, fromId?: string) => {
    if (endedRef.current || fromId === meId) return;
    setCells((prev) => {
      if (prev[cell]) return prev;
      const next = [...prev];
      next[cell] = sym;
      return next;
    });
  };

  // net: apply peer moves as they arrive
  useEffect(() => {
    if (isDemo) return;
    return store.onGameMove((move, fromId) => {
      if (move.game !== 'tictactoe' || move.round !== round) return;
      applyMove(move.cell, mySym === 'X' ? 'O' : 'X', fromId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, round, mySym]);

  // demo: AI opponent
  useEffect(() => {
    if (!isDemo || ended || winner || draw) return;
    if ((moves % 2 === 0) === (mySym === 'X')) return; // my turn
    const t = window.setTimeout(() => {
      const pick = aiPick(cells, mySym === 'X' ? 'O' : 'X', mySym);
      if (pick >= 0) {
        sound.play('pop');
        applyMove(pick, mySym === 'X' ? 'O' : 'X');
      }
    }, 650);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moves, winner, draw, isDemo, mySym, ended]);

  // end detection
  useEffect(() => {
    if (winner || draw) finish(winner, draw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, draw]);

  const tap = (cell: number) => {
    if (ended || !myTurn || cells[cell]) {
      if (cells[cell] || ended) sound.play('hit');
      return;
    }
    sound.play('place');
    applyMove(cell, mySym);
    if (!isDemo) {
      store.sendGameMove({ type: 'game-move', game: 'tictactoe', round, cell, fromId: meId });
    }
  };

  const status = winner
    ? winner === mySym
      ? 'You win!'
      : `${peerName} wins!`
    : draw
      ? 'Draw!'
      : myTurn
        ? 'Your move!'
        : `${peerName} is thinking…`;

  return (
    <div className="bg-arena flex h-full flex-col items-center justify-center gap-5 px-4">
      <div className="flex items-center gap-6 animate-slide-up">
        <span className="chip !border-[#ff8b94]/60 font-display text-sm text-cream">
          <span className="font-black text-[#ff6b7a]">X</span> You
        </span>
        <span className="chip animate-floaty !border-daisy/60 font-display text-sm text-cream">
          Tic Tac Toe
        </span>
        <span className="chip !border-[#74c7ff]/60 font-display text-sm text-cream">
          <span className="font-black text-[#6ec6ff]">O</span> {peerName}
        </span>
      </div>

      <div
        className={`animate-pop rounded-3xl border-4 border-white/20 bg-white/10 px-5 py-2 font-display text-xl text-cream text-outline shadow-[0_10px_0_rgba(42,26,85,0.45)] ${
          myTurn && !winner ? 'animate-pulse-glow' : ''
        }`}
      >
        {status}
      </div>

      <div className="grid grid-cols-3 gap-2 animate-slide-up" style={{ animationDelay: '80ms' }}>
        {cells.map((c, i) => (
          <button
            key={i}
            onClick={() => tap(i)}
            aria-label={`cell ${i + 1}`}
            className={`flex h-24 w-24 items-center justify-center rounded-2xl border-[3px] font-display text-5xl shadow-[0_6px_0_rgba(42,26,85,0.45)] transition-transform active:scale-95 sm:h-28 sm:w-28 ${
              c === 'X'
                ? 'border-[#ff8b94]/60 bg-[#ff4d5e]/25 text-[#ff7a89]'
                : c === 'O'
                  ? 'border-[#74c7ff]/60 bg-[#4aa8ff]/25 text-[#6ec6ff]'
                  : 'border-white/20 bg-white/10 text-transparent hover:border-daisy/60'
            }`}
          >
            {c ?? '·'}
          </button>
        ))}
      </div>

      <p className="text-xs font-bold text-white/50">Tap a cell to place {mySym}</p>
    </div>
  );
}
