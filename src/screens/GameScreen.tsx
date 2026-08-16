import { useCallback, useEffect, useRef, useState } from 'react';
import { Character } from '../components/characters/Character';
import { ArcadeButton } from '../components/ui/ArcadeButton';
import { Confetti } from '../design/Confetti';
import { CountdownOverlay, type CountdownStage } from '../gameShell/CountdownOverlay';
import { sound } from '../audio/SoundManager';
import { DemoArena } from './DemoArena';
import { TicTacToeBoard } from '../games/ticTacToe/TicTacToeBoard';
import { getRoomStore, useRoom } from '../net/roomStore';
import { getIdentity } from '../net/identity';
import type { CharacterColor } from '../components/characters/characterTypes';

interface GameScreenProps {
  demo?: boolean;
  demoGameId?: string;
  demoRound?: number;
  onRematch?: () => void;
  onExit?: () => void;
}

const COUNT_TIMING = 450;

function seedHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function GameScreen({ demo, demoGameId, demoRound, onRematch, onExit }: GameScreenProps) {
  const room = useRoom();
  const me = getIdentity();

  const code = room.room?.code ?? `demo-${demoGameId ?? 'sumo'}`;
  const gameId = room.room?.gameId ?? demoGameId ?? 'sumo';

  const [round, setRound] = useState(0);
  const seedRound = demo && demoRound !== undefined ? demoRound : round;
  const [countdown, setCountdown] = useState<CountdownStage | null>(3);
  const [playing, setPlaying] = useState(false);
  const [winner, setWinner] = useState<0 | 1 | 2 | null>(null);
  const [myVote, setMyVote] = useState(false);
  const timers = useRef<number[]>([]);

  const seed = `${code}:${gameId}:${seedRound}`;
  const computedWinner = (seedHash(seed) % 3) as 0 | 1 | 2;

  const beginCountdown = useCallback(() => {
    const store = getRoomStore();
    if (store.getSnapshot().phase === 'playing') store.beginRound();
    sound.play('whoosh');
    setCountdown(3);
    setPlaying(false);
    setWinner(null);
    setMyVote(false);
    timers.current = [3, 2, 1, 'go'].map((stage, i) =>
      window.setTimeout(() => {
        if (stage === 'go') {
          sound.play('go');
          setCountdown('go');
          window.setTimeout(() => {
            setCountdown(null);
            setPlaying(true);
          }, 480);
        } else {
          sound.play('count');
          setCountdown(stage as CountdownStage);
        }
      }, i * COUNT_TIMING),
    );
  }, []);

  useEffect(() => {
    beginCountdown();
    return () => timers.current.forEach(window.clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRoundEnd = useCallback(
    (w: 0 | 1 | 2) => {
      setWinner(w);
      if (w === 2) sound.play('pop');
      else {
        sound.play('win');
        window.setTimeout(() => sound.play('lose'), 350);
      }
      const store = getRoomStore();
      if (!demo && store.getSnapshot().phase === 'playing') store.finishRound();
    },
    [demo],
  );

  // net: auto-restart when both players vote for a rematch
  useEffect(() => {
    if (!demo && room.phase === 'result' && room.rematchReady) {
      setRound((r) => r + 1);
      beginCountdown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.phase, room.rematchReady, demo]);

  const actions = getRoomStore();

  if (room.peerGone) {
    return (
      <div className="bg-arena flex h-full flex-col items-center justify-center gap-6 px-6">
        <Character color="blue" state="lose" size={110} />
        <p className="font-display text-3xl text-cream text-outline">Friend disconnected</p>
        <p className="text-sm font-bold text-white/70">They dropped out of the room.</p>
        <ArcadeButton
          variant="grape"
          size="lg"
          onClick={() => {
            sound.play('click');
            actions.leave();
          }}
        >
          Back to Menu
        </ArcadeButton>
      </div>
    );
  }

  if (winner !== null) {
    const winColor: CharacterColor = winner === 0 ? 'red' : 'blue';
    const loseColor: CharacterColor = winner === 0 ? 'blue' : 'red';
    const peerVote = demo ? true : (room.room?.players.find((p) => p.id !== me.id)?.rematchVote ?? false);
    const title = winner === 2 ? "It's a draw!" : `${winner === 0 ? 'Player 1' : 'Player 2'} wins!`;
    const tttDemo = demo && gameId === 'tictactoe';
    const iAmWinner = tttDemo
      ? winner === 0
      : demo || (winner === 0 && room.isHost) || (winner === 1 && !room.isHost);

    return (
      <div className="bg-arena relative flex min-h-full flex-col items-center justify-center gap-6 overflow-hidden px-4">
        {iAmWinner && winner !== 2 && <Confetti />}
        <div className="animate-pop font-display text-4xl text-cream text-outline-thick sm:text-5xl">
          {demo ? title : iAmWinner ? (winner === 2 ? "It's a draw!" : 'You win!') : 'Round lost'}
        </div>

        <div className="flex items-end gap-6">
          <Character color={loseColor} state="lose" size={110} />
          {winner !== 2 && <Character color={winColor} state="celebrate" size={150} />}
        </div>

        {!demo && (
          <div className="flex items-center gap-2 text-sm font-bold text-white/70">
            <span className="chip">
              {myVote
                ? 'You: rematch ✓'
                : peerVote
                  ? 'Waiting for friend…'
                  : 'Round over — vote for rematch'}
            </span>
            <span className="chip">
              {peerVote
                ? 'Friend: rematch ✓'
                : myVote
                  ? 'Waiting for you…'
                  : 'Round over — waiting for friend'}
            </span>
          </div>
        )}

        <div className="flex w-full max-w-xs flex-col gap-3">
          {demo ? (
            <>
              <ArcadeButton
                variant="daisy"
                size="lg"
                className="w-full"
                onClick={() => {
                  sound.play('rematch');
                  onRematch?.();
                }}
              >
                ⚡ Rematch
              </ArcadeButton>
              <ArcadeButton variant="grape" size="md" className="w-full" onClick={() => onExit?.()}>
                Back to Menu
              </ArcadeButton>
            </>
          ) : (
            <>
              <ArcadeButton
                variant="daisy"
                size="lg"
                className="w-full"
                disabled={myVote}
                onClick={() => {
                  sound.play('rematch');
                  setMyVote(true);
                  void actions.voteRematch();
                }}
              >
                {myVote ? 'Waiting for friend…' : '⚡ Rematch'}
              </ArcadeButton>
              <ArcadeButton
                variant="grape"
                size="md"
                className="w-full"
                onClick={() => {
                  sound.play('click');
                  actions.leave();
                }}
              >
                Back to Menu
              </ArcadeButton>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {!playing && countdown !== null && <CountdownOverlay stage={countdown} />}
      {playing && (
        gameId === 'tictactoe' ? (
          <TicTacToeBoard key={seedRound} isDemo={!!demo} round={seedRound} onEnd={handleRoundEnd} />
        ) : (
          <DemoArena gameId={gameId} winner={computedWinner} onRoundEnd={handleRoundEnd} />
        )
      )}
    </div>
  );
}
