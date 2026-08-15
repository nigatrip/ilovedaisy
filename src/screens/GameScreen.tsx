import { useCallback, useEffect, useRef, useState } from 'react';
import { Character } from '../components/characters/Character';
import { ArcadeButton } from '../components/ui/ArcadeButton';
import { Confetti } from '../design/Confetti';
import { CountdownOverlay, type CountdownStage } from '../gameShell/CountdownOverlay';
import { sound } from '../audio/SoundManager';
import { DemoArena } from './DemoArena';

interface GameScreenProps {
  gameId: string;
  onRematch: () => void;
  onExit: () => void;
}

const COUNT_TIMING = 450;

export function GameScreen({ gameId, onRematch, onExit }: GameScreenProps) {
  const [countdown, setCountdown] = useState<CountdownStage | null>(3);
  const [playing, setPlaying] = useState(false);
  const [winner, setWinner] = useState<0 | 1 | 2 | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    sound.play('whoosh');
    setCountdown(3);
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
    return () => {
      timers.current.forEach(window.clearTimeout);
    };
  }, [gameId]);

  const handleRoundEnd = useCallback((w: 0 | 1 | 2) => {
    setWinner(w);
    if (w === 2) {
      sound.play('pop');
    } else {
      sound.play('win');
      window.setTimeout(() => sound.play('lose'), 350);
    }
  }, []);

  if (winner !== null) {
    const winColor = winner === 0 ? 'red' : 'blue';
    const loseColor = winner === 0 ? 'blue' : 'red';
    const title = winner === 2 ? "It's a draw!" : `${winner === 0 ? 'Player 1' : 'Player 2'} wins!`;
    return (
      <div className="bg-arena relative flex min-h-full flex-col items-center justify-center gap-6 overflow-hidden px-4">
        <Confetti />
        <div className="animate-pop font-display text-5xl text-cream text-outline-thick">{title}</div>

        <div className="flex items-end gap-6">
          <Character color={loseColor} state="lose" size={110} />
          {winner !== 2 && <Character color={winColor} state="celebrate" size={150} />}
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3">
          <ArcadeButton
            variant="daisy"
            size="lg"
            className="w-full"
            onClick={() => {
              sound.play('rematch');
              onRematch();
            }}
          >
            ⚡ Rematch
          </ArcadeButton>
          <ArcadeButton
            variant="grape"
            size="md"
            className="w-full"
            onClick={() => {
              sound.play('click');
              onExit();
            }}
          >
            Back to Menu
          </ArcadeButton>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {!playing && countdown !== null && <CountdownOverlay stage={countdown} />}
      {playing && <DemoArena gameId={gameId} onRoundEnd={handleRoundEnd} />}
    </div>
  );
}
