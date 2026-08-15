import { GAME_BY_ID, CATEGORY_LABELS } from '../../gameShell/registry';
import { CardArt } from './CardArt';
import { Badge } from '../ui/Panel';

export function GameCard({
  gameId,
  onClick,
  locked = false,
}: {
  gameId: string;
  onClick: () => void;
  locked?: boolean;
}) {
  const game = GAME_BY_ID[gameId];
  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-[1.25rem] border-[3px] border-white/25 shadow-[0_8px_0_rgba(42,26,85,0.45),0_16px_28px_-12px_rgba(0,0,0,0.6)] transition-transform duration-150 active:scale-[0.97] active:translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-daisy/60 text-left"
      aria-label={game.title}
    >
      <div className="aspect-[4/3] w-full">
        <CardArt gameId={gameId} />
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#2a1a55]/55">
            <span className="rounded-full bg-white/90 px-4 py-1.5 text-sm font-extrabold text-[#2a1a55] shadow-md">
              Coming soon
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#2c175f]/95">
        <div className="min-w-0">
          <p className="font-display text-[1.05rem] leading-tight text-cream text-outline truncate">
            {game.title}
          </p>
          <p className="text-xs font-semibold text-white/70 truncate">{game.tagline}</p>
        </div>
        <Badge className="shrink-0 text-[0.7rem]">{CATEGORY_LABELS[game.category]}</Badge>
      </div>
    </button>
  );
}
