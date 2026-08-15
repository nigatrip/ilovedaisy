export type CountdownStage = 3 | 2 | 1 | 'go';

export function CountdownOverlay({ stage }: { stage: CountdownStage }) {
  const isGo = stage === 'go';
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-[#24125c]/40">
      <div
        key={String(stage)}
        className={`font-display animate-count text-outline-thick ${
          isGo
            ? 'text-[5.5rem] text-lime drop-shadow-[0_0_30px_rgba(140,229,99,0.8)]'
            : 'text-[6rem] text-cream'
        }`}
      >
        {isGo ? 'GO!' : stage}
      </div>
    </div>
  );
}
