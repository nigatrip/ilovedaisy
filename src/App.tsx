import { useEffect, useState } from 'react';
import { MenuScreen } from './screens/MenuScreen';
import { RoomScreen } from './screens/RoomScreen';
import { GameScreen } from './screens/GameScreen';
import { sound } from './audio/SoundManager';
import { getRoomStore, useRoom } from './net/roomStore';
import { Character } from './components/characters/Character';
import { Logo } from './components/ui/Logo';

export default function App() {
  const room = useRoom();
  const [demo, setDemo] = useState(false);
  const [demoGame, setDemoGame] = useState('sumo');
  const [demoRound, setDemoRound] = useState(0);

  useEffect(() => {
    const unlock = () => sound.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    const h = window.location.hash.replace(/^#/, '');
    const [kind, value] = h.split(':');
    if (kind === 'room' && value) void getRoomStore().joinRoom(value);
    if (kind === 'game' && value) {
      setDemo(true);
      setDemoGame(value);
    }
  }, []);

  if (room.phase === 'creating') {
    return (
      <div className="bg-arena flex h-full flex-col items-center justify-center gap-4">
        <Logo size="md" className="animate-floaty" />
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-3 w-3 animate-bounce rounded-full bg-daisy" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
        <p className="text-sm font-bold text-white/70">Connecting…</p>
      </div>
    );
  }

  if (room.phase === 'pending') {
    return (
      <div className="bg-arena flex h-full flex-col items-center justify-center gap-6 px-6">
        <Character color="blue" state="jump" size={110} />
        <div className="text-center">
          <p className="font-display text-3xl text-cream text-outline">Requesting to join…</p>
          <p className="mt-2 text-sm font-bold text-white/70">Waiting for the host to accept you</p>
        </div>
        <button
          className="arcade-btn arcade-btn--grape px-5 py-2 text-sm"
          onClick={() => getRoomStore().leave()}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (room.phase === 'lobby') {
    return <RoomScreen />;
  }

  if (room.phase === 'playing' || room.phase === 'result') {
    return <GameScreen key={`${room.room?.code ?? 'x'}:${room.room?.gameId ?? 'sumo'}`} />;
  }

  if (demo) {
    return (
      <GameScreen
        key={`demo:${demoGame}:${demoRound}`}
        demo
        demoGameId={demoGame}
        demoRound={demoRound}
        onRematch={() => setDemoRound((r) => r + 1)}
        onExit={() => setDemo(false)}
      />
    );
  }

  return (
    <MenuScreen
      onCreateRoom={() => void getRoomStore().createRoom()}
      onJoinRoom={(code) => void getRoomStore().joinRoom(code)}
      onDemo={(gameId) => {
        setDemo(true);
        setDemoGame(gameId);
      }}
    />
  );
}
