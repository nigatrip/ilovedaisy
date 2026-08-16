import { useEffect, useRef, useState } from 'react';
import { getRoomStore } from '../../net/roomStore';
import { sound } from '../../audio/SoundManager';

interface ConnectFourProps {
  isDemo: boolean;
  round: number;
  onEnd: (winner: 0 | 1 | 2) => void;
}

const COLS = 7;
const ROWS = 6;
const CELL = 48;
const GAP = 4;

const LINES = (() => {
  const lines: number[][][] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (c + 3 < COLS) lines.push([[r, c], [r, c + 1], [r, c + 2], [r, c + 3]]);
    if (r + 3 < ROWS) lines.push([[r, c], [r + 1, c], [r + 2, c], [r + 3, c]]);
    if (r + 3 < ROWS && c + 3 < COLS) lines.push([[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]]);
    if (r + 3 < ROWS && c - 3 >= 0) lines.push([[r, c], [r + 1, c - 1], [r + 2, c - 2], [r + 3, c - 3]]);
  }
  return lines;
})();

function evaluate(board: (0 | 1 | 2)[][]): { winner: 0 | 1 | 2 | null; draw: boolean } {
  for (const line of LINES) {
    const [a, b, c, d] = line;
    const v = board[a[0]][a[1]];
    if (v && v === board[b[0]][b[1]] && v === board[c[0]][c[1]] && v === board[d[0]][d[1]]) {
      return { winner: v as 1 | 2, draw: false };
    }
  }
  return { winner: null, draw: board[0].every((v) => v !== 0) };
}

export function ConnectFour({ isDemo, round, onEnd }: ConnectFourProps) {
  const store = getRoomStore();
  const snap = store.getSnapshot();
  const meId = snap.me.id;
  const myPlayer = snap.myPlayer;
  const peer = snap.room?.players.find((p) => p.id !== meId);

  const [board, setBoard] = useState<(0 | 1 | 2)[][]>(() => Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [hoverCol, setHoverCol] = useState(-1);
  const endedRef = useRef(false);

  const finish = (w: 0 | 1 | 2) => {
    if (endedRef.current) return;
    endedRef.current = true;
    window.setTimeout(() => onEnd(w), 800);
  };

  const checkWinner = (b: (0 | 1 | 2)[][]): 0 | 1 | 2 | null => {
    const res = evaluate(b);
    if (res.winner !== null) {
      return res.winner === myColor ? 0 : 1;
    } else if (res.draw) {
      return 2;
    }
    return null;
  };

  const myColor = myPlayer?.role === 'host' ? 1 : 2;
  const peerColor = myColor === 1 ? 2 : 1;
  const myTurn = currentPlayer === myColor;

  const drop = (col: number) => {
    if (endedRef.current || !myTurn || board[0][col] !== 0) return;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === 0) {
        const next = board.map((row, i) => i === r ? row.map((v, c) => c === col ? myColor : v) : row);
        setBoard(next);
        setCurrentPlayer(myColor === 1 ? 2 : 1);
        sound.play('pop');
        store.sendGameMove({
          type: 'game-move',
          game: 'connect4',
          round,
          payload: { type: 'drop', col, player: myColor },
          fromId: meId,
        });
        const w = checkWinner(next);
        if (w !== null) finish(w);
        break;
      }
    }
  };

  useEffect(() => {
    if (isDemo) return;
    return store.onGameMove((move, _fromId) => {
      if (move.game !== 'connect4' || move.round !== round) return;
      if (move.payload?.type === 'drop' && move.payload.player === peerColor) {
        for (let r = ROWS - 1; r >= 0; r--) {
          if (board[r][move.payload.col as number] === 0) {
            const next = board.map((row, i) => i === r ? row.map((v, c) => c === move.payload.col ? peerColor : v) : row);
            setBoard(next);
            setCurrentPlayer(myColor);
            sound.play('pop');
            const w = checkWinner(next);
            if (w !== null) finish(w);
            break;
          }
        }
      }
    });
  }, [isDemo, round]);

  const peerName = isDemo ? 'Daisy' : peer?.name ?? 'Friend';

  return (
    <div className="bg-sunset-arena flex h-full flex-col items-center justify-center gap-4 px-4">
      <div className="flex items-center gap-6 animate-slide-up">
        <span className="chip !border-[#ff8b94]/60 font-display text-sm text-cream">
          <span className="font-black text-[#ff6b7a]">●</span> You
        </span>
        <span className="chip animate-floaty !border-daisy/60 font-display text-sm text-cream">Connect Four</span>
        <span className="chip !border-[#74c7ff]/60 font-display text-sm text-cream">
          <span className="font-black text-[#6ec6ff]">●</span> {peerName}
        </span>
      </div>

      <div className={`animate-pop rounded-3xl border-4 border-white/20 bg-white/10 px-5 py-2 font-display text-xl text-cream text-outline shadow-[0_10px_0_rgba(42,26,85,0.45)] ${myTurn && !checkWinner(board) ? 'animate-pulse-glow' : ''}`}>
        {((): string => { const w = checkWinner(board); if (w === 0) return 'You win!'; if (w === 1) return `${peerName} wins!`; if (w === 2) return 'Draw!'; return myTurn ? 'Your move!' : `${peerName} is thinking…`; })()}
      </div>

      <div className="relative" style={{ width: COLS * (CELL + GAP) + GAP, height: ROWS * (CELL + GAP) + GAP }}>
        <div className="absolute inset-0 rounded-2xl bg-[#1a3c6e] border-4 border-[#2a5aa0] shadow-[inset_0_-20px_40px_rgba(26,60,110,0.5),0_10px_0_rgba(42,26,85,0.4)]" />
        <div className="absolute inset-0 rounded-2xl border-2 border-white/20 pointer-events-none" />

        {Array.from({ length: COLS }).map((_, c) => (
          <button
            key={c}
            onClick={() => drop(c)}
            onMouseEnter={() => setHoverCol(c)}
            onMouseLeave={() => setHoverCol(-1)}
            disabled={endedRef.current || !myTurn || board[0][c] !== 0}
            className="absolute top-0 w-[48px] h-full bg-transparent hover:bg-white/10 transition-colors"
            style={{ left: `${c * (CELL + GAP) + GAP}px` }}
          />
        ))}

        {board.flatMap((row, r) =>
          row.map((v, c) => v !== 0 ? (
            <div
              key={`${r}-${c}`}
              className="absolute rounded-full border-3 shadow-[0_4px_0_rgba(0,0,0,0.4)] transition-transform duration-200"
              style={{
                left: `${c * (CELL + GAP) + GAP + (CELL - CELL * 0.8) / 2}px`,
                top: `${r * (CELL + GAP) + GAP + (CELL - CELL * 0.8) / 2}px`,
                width: CELL * 0.8,
                height: CELL * 0.8,
                background: v === 1 ? '#ff6b7a' : '#6ec6ff',
                borderColor: v === 1 ? '#ff3d4f' : '#4aa8ff',
              }}
            />
          ) : null)
        )}

        {hoverCol >= 0 && board[0][hoverCol] === 0 && myTurn && !endedRef.current && (
          <div
            className="absolute top-0 rounded-full border-3 opacity-50 animate-pulse"
            style={{
              left: `${hoverCol * (CELL + GAP) + GAP + (CELL - CELL * 0.8) / 2}px`,
              width: CELL * 0.8,
              height: CELL * 0.8,
              background: myColor === 1 ? '#ff6b7a' : '#6ec6ff',
              borderColor: myColor === 1 ? '#ff3d4f' : '#4aa8ff',
            }}
          />
        )}
      </div>

      <p className="text-xs font-bold text-white/50">
        {isDemo ? 'Hover column · Click to drop' : 'Hover column, click to drop · Connect 4 to win!'}
      </p>
    </div>
  );
}