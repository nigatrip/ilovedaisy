import { useEffect, useMemo, useState } from 'react';
import { Character } from '../components/characters/Character';
import type { CharacterState } from '../components/characters/characterTypes';
import { GAME_BY_ID } from '../gameShell/registry';
import { sound } from '../audio/SoundManager';

interface DemoArenaProps {
  gameId: string;
  onRoundEnd: (winner: 0 | 1 | 2) => void;
}

const ARENA_BG: Record<string, string> = {
  sumo: 'bg-sunset-arena',
  tug: 'bg-grape-arena',
  football: 'bg-mint-arena',
  tank: 'bg-sky-arena',
  race: 'bg-sky-arena',
  tictactoe: 'bg-mint-arena',
  connect4: 'bg-sunset-arena',
  tapbattle: 'bg-sunset-arena',
};

const POSE: Record<string, CharacterState> = {
  sumo: 'push',
  tug: 'pull',
  football: 'run',
  tank: 'attack',
  race: 'run',
  tictactoe: 'idle',
  connect4: 'idle',
  tapbattle: 'attack',
};

export function DemoArena({ gameId, onRoundEnd }: DemoArenaProps) {
  const game = GAME_BY_ID[gameId];
  const [t, setT] = useState(0);
  const [winner] = useState<0 | 1 | 2>(() => (Math.random() < 0.5 ? 0 : 1));

  useEffect(() => {
    const start = performance.now();
    const id = window.setInterval(() => {
      const elapsed = (performance.now() - start) / 1000;
      setT(Math.min(1, elapsed / 8));
      if (elapsed >= 8) {
        window.clearInterval(id);
        onRoundEnd(winner);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [onRoundEnd, winner]);

  const arenaClass = ARENA_BG[gameId] ?? 'bg-sky-arena';
  const pose = useMemo(() => POSE[gameId] ?? 'idle', [gameId]);

  return (
    <div className={`relative flex h-full flex-col overflow-hidden ${arenaClass}`}>
      <header className="flex items-center justify-between px-4 pt-4">
        <span className="chip">DEMO ROUND</span>
        <h1 className="font-display text-2xl text-cream text-outline">{game.title}</h1>
        <span className="chip">8s</span>
      </header>

      <div className="mx-4 mt-2 h-3 overflow-hidden rounded-full bg-[#2a1a55]/35">
        <div
          className="h-full rounded-full bg-gradient-to-r from-daisy to-lime"
          style={{ width: `${(1 - t) * 100}%` }}
        />
      </div>

      <main className="relative flex flex-1 items-end justify-between px-6 pb-4">
        <div className="flex flex-col items-center gap-1">
          <span className="chip">P1</span>
          <Character color="red" state={pose} facing="right" size={120} />
        </div>

        {gameId === 'sumo' && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex h-28 w-56 items-center justify-center rounded-full bg-gradient-to-b from-[#ffcf6b] to-[#ff8a5c] shadow-[inset_0_6px_0_rgba(255,255,255,0.35),0_10px_0_rgba(42,26,85,0.4)] border-4 border-[#2a1a55]">
              <span className="font-display text-3xl text-[#7a4a00]/80 text-outline">VS</span>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-1">
          <span className="chip">P2</span>
          <Character color="blue" state={pose} facing="left" size={120} />
        </div>
      </main>

      <div className="px-6 pb-5">
        <p className="text-center text-sm font-bold text-white/85">
          {game.tagline}
          <span className="block text-xs font-semibold text-white/55">{game.controls}</span>
        </p>
      </div>

      <button
        className="absolute bottom-20 right-4 arcade-btn arcade-btn--daisy px-4 py-2 text-sm"
        onClick={() => {
          sound.play('hit');
          onRoundEnd(winner);
        }}
      >
        Skip ⏭
      </button>
    </div>
  );
}
