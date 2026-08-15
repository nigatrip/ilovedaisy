import { Character } from '../components/characters/Character';
import { GameCard } from '../components/cards/GameCard';
import { GAMES } from '../gameShell/registry';
import { sound } from '../audio/SoundManager';

interface RoomScreenProps {
  code: string;
  onPickGame: (gameId: string) => void;
  onLeave: () => void;
}

function PlayerCard({ color, name, chip }: { color: 'red' | 'blue'; name: string; chip: string }) {
  return (
    <div className="panel flex flex-col items-center gap-2 px-3 py-4">
      <span className={`chip ${color === 'red' ? '!border-[#ff8b94]/60' : '!border-[#74c7ff]/60'}`}>{chip}</span>
      <Character color={color} state="idle" facing={color === 'red' ? 'right' : 'left'} size={96} />
      <span className="font-display text-lg text-cream text-outline">{name}</span>
      <span className="rounded-full bg-[#8ce563]/25 px-3 py-0.5 text-xs font-extrabold text-lime ring-2 ring-lime/50">
        READY ✓
      </span>
    </div>
  );
}

export function RoomScreen({ code, onPickGame, onLeave }: RoomScreenProps) {
  return (
    <div className="bg-arena flex min-h-full flex-col items-center overflow-y-auto no-scrollbar px-4 pb-8">
      <header className="mt-6 flex w-full max-w-md items-center justify-between animate-slide-up">
        <button
          className="arcade-btn arcade-btn--grape px-3 py-1.5 text-sm"
          onClick={() => {
            sound.play('click');
            onLeave();
          }}
        >
          ‹ Leave
        </button>
        <div className="text-center">
          <span className="text-xs font-bold tracking-widest text-white/60">ROOM</span>
          <div className="font-display text-3xl tracking-[0.2em] text-daisy text-outline">{code}</div>
        </div>
        <div className="w-16" />
      </header>

      <div className="mt-6 grid w-full max-w-md grid-cols-[1fr_auto_1fr] items-center gap-2 animate-slide-up">
        <PlayerCard color="red" name="P1" chip="YOU" />
        <div className="flex flex-col items-center gap-1 px-1">
          <span className="font-display text-4xl text-cream text-outline-thick">VS</span>
          <span className="chip">2/2</span>
        </div>
        <PlayerCard color="blue" name="P2" chip="FRIEND" />
      </div>

      <div className="mt-8 w-full max-w-4xl animate-slide-up">
        <div className="mb-3 flex items-center gap-3">
          <span className="h-1 flex-1 rounded-full bg-white/20" />
          <h2 className="font-display text-xl text-cream text-outline">Choose a game</h2>
          <span className="h-1 flex-1 rounded-full bg-white/20" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {GAMES.map((g) => (
            <GameCard key={g.id} gameId={g.id} onClick={() => { sound.play('go'); onPickGame(g.id); }} />
          ))}
        </div>
      </div>

      <p className="mt-8 text-xs font-semibold text-white/40">
        Tap any card to start a demo round · real 2-player netplay is next
      </p>
    </div>
  );
}
