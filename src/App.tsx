import { useEffect, useState } from 'react';
import { MenuScreen } from './screens/MenuScreen';
import { RoomScreen } from './screens/RoomScreen';
import { GameScreen } from './screens/GameScreen';
import { sound } from './audio/SoundManager';

type Screen = 'menu' | 'room' | 'game';

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** Parse initial location for deep links: #room:CODE  or  #game:GAMEID */
function initialRoute(): { screen: Screen; code: string; gameId: string } {
  const h = window.location.hash.replace(/^#/, '');
  const [kind, value] = h.split(':');
  if (kind === 'room') return { screen: 'room', code: (value ?? '').toUpperCase().slice(0, 6) || randomCode(), gameId: 'sumo' };
  if (kind === 'game') return { screen: 'game', code: randomCode(), gameId: value || 'sumo' };
  return { screen: 'menu', code: '', gameId: 'sumo' };
}

export default function App() {
  const init = initialRoute();
  const [screen, setScreen] = useState<Screen>(init.screen);
  const [roomCode, setRoomCode] = useState(init.code);
  const [gameId, setGameId] = useState(init.gameId);
  const [round, setRound] = useState(0);

  useEffect(() => {
    const unlock = () => sound.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return (
    <div className="h-full w-full">
      <div className="mx-auto h-full w-full max-w-6xl">
        {screen === 'menu' && (
          <MenuScreen
            onCreateRoom={() => {
              setRoomCode(randomCode());
              setScreen('room');
            }}
            onJoinRoom={(code) => {
              setRoomCode(code);
              setScreen('room');
            }}
            onPickGame={(id) => {
              setGameId(id);
              setRound(0);
              setScreen('game');
            }}
          />
        )}
        {screen === 'room' && (
          <RoomScreen
            code={roomCode}
            onPickGame={(id) => {
              setGameId(id);
              setRound(0);
              setScreen('game');
            }}
            onLeave={() => setScreen('menu')}
          />
        )}
        {screen === 'game' && (
          <GameScreen
            key={`${gameId}-${round}`}
            gameId={gameId}
            onRematch={() => setRound((r) => r + 1)}
            onExit={() => setScreen('menu')}
          />
        )}
      </div>
    </div>
  );
}
