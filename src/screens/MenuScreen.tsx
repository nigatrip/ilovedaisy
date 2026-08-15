import { useState } from 'react';
import { Logo } from '../components/ui/Logo';
import { ArcadeButton } from '../components/ui/ArcadeButton';
import { GameCard } from '../components/cards/GameCard';
import { GAMES, PLAYABLE } from '../gameShell/registry';
import { sound } from '../audio/SoundManager';
import { useRoom, useRoomActions } from '../net/roomStore';

interface MenuScreenProps {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onDemo: (gameId: string) => void;
}

export function MenuScreen({ onCreateRoom, onJoinRoom, onDemo }: MenuScreenProps) {
  const [code, setCode] = useState('');
  const room = useRoom();
  const actions = useRoomActions();

  return (
    <div className="bg-arena flex min-h-full flex-col items-center overflow-y-auto no-scrollbar px-4 pb-8">
      <div className="animate-bounce-in mt-8 flex flex-col items-center">
        <Logo size="lg" />
        <p className="mt-2 text-sm font-bold tracking-wide text-white/70">
          2-player private party duels · made for friends
        </p>
      </div>

      {room.error && (
        <div className="mt-4 w-full max-w-sm animate-pop rounded-2xl border-2 border-[#ff4d5e]/60 bg-[#ff4d5e]/20 px-4 py-3 text-center text-sm font-bold text-cream">
          {room.error}
          <button className="ml-2 font-extrabold text-daisy" onClick={() => actions.clearError()}>
            ✕
          </button>
        </div>
      )}

      <div className="mt-8 flex w-full max-w-sm flex-col items-stretch gap-3 animate-slide-up">
        <ArcadeButton
          variant="p1"
          size="lg"
          className="w-full"
          onClick={() => {
            sound.play('click');
            onCreateRoom();
          }}
        >
          Create Room
        </ArcadeButton>

        <div className="flex w-full gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="ROOM CODE"
            maxLength={6}
            aria-label="Room code"
            className="min-w-0 flex-1 rounded-[1.25rem] border-[3px] border-white/25 bg-white/15 px-4 py-3 text-center font-display text-xl tracking-[0.3em] text-cream placeholder:text-white/40 outline-none focus:border-daisy/70"
          />
          <ArcadeButton
            variant="p2"
            size="md"
            disabled={code.length < 3}
            onClick={() => {
              sound.play('click');
              onJoinRoom(code);
            }}
          >
            Join
          </ArcadeButton>
        </div>
      </div>

      <div className="mt-10 w-full max-w-4xl animate-slide-up">
        <div className="mb-3 flex items-center gap-3">
          <span className="h-1 flex-1 rounded-full bg-white/20" />
          <h2 className="font-display text-2xl text-cream text-outline">Game Collection</h2>
          <span className="h-1 flex-1 rounded-full bg-white/20" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {GAMES.map((g, i) => (
            <div key={g.id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <GameCard gameId={g.id} locked={!PLAYABLE[g.id]} onClick={() => { sound.play('click'); onDemo(g.id); }} />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-10 text-xs font-semibold text-white/40">
        Tap a card to preview the demo · join a friend for real duels
      </p>
    </div>
  );
}
