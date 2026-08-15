import { Character } from '../components/characters/Character';
import { GameCard } from '../components/cards/GameCard';
import { GAMES } from '../gameShell/registry';
import { sound } from '../audio/SoundManager';
import { useRoom, useRoomActions } from '../net/roomStore';
import { getIdentity, saveIdentity } from '../net/identity';
import type { RoomPlayer } from '../net/types';

function PlayerCard({
  player,
  isMe,
  ready,
}: {
  player: RoomPlayer | null;
  isMe: boolean;
  ready: boolean;
}) {
  const color = player?.color ?? (isMe ? 'red' : 'blue');
  return (
    <div className="panel flex flex-col items-center gap-2 px-3 py-4">
      <span
        className={`chip ${
          color === 'red' ? '!border-[#ff8b94]/60' : '!border-[#74c7ff]/60'
        }`}
      >
        {color === 'red' ? 'HOST' : 'GUEST'}
      </span>
      <Character
        color={color}
        state={ready ? 'jump' : 'idle'}
        facing={color === 'red' ? 'right' : 'left'}
        size={96}
      />
      <span className="font-display text-lg text-cream text-outline">
        {player?.name ?? (isMe ? 'You' : 'Waiting…')}
      </span>
      {player ? (
        ready ? (
          <span className="rounded-full bg-[#8ce563]/25 px-3 py-0.5 text-xs font-extrabold text-lime ring-2 ring-lime/50">
            READY ✓
          </span>
        ) : (
          <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-extrabold text-white/60 ring-2 ring-white/20">
            NOT READY
          </span>
        )
      ) : (
        <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-extrabold text-white/50 ring-2 ring-white/20">
          <span className="animate-pulse">…</span>
        </span>
      )}
    </div>
  );
}

export function RoomScreen() {
  const room = useRoom();
  const actions = useRoomActions();
  const me = getIdentity();
  const myPlayer = room.myPlayer;
  const peer = (room.room?.players ?? []).find((p) => p.id !== me.id) ?? null;

  const ready = myPlayer?.ready ?? false;

  return (
    <div className="bg-arena flex min-h-full flex-col items-center overflow-y-auto no-scrollbar px-4 pb-8">
      <header className="mt-6 flex w-full max-w-md items-center justify-between animate-slide-up">
        <button
          className="arcade-btn arcade-btn--grape px-3 py-1.5 text-sm"
          onClick={() => {
            sound.play('click');
            actions.leave();
          }}
        >
          ‹ Leave
        </button>
        <div className="text-center">
          <span className="text-xs font-bold tracking-widest text-white/60">ROOM</span>
          <button
            className="font-display text-3xl tracking-[0.2em] text-daisy text-outline"
            onClick={async () => {
              await navigator.clipboard.writeText(`${location.origin}/#room:${room.room?.code}`);
              sound.play('pop');
            }}
            title="Copy invite link"
          >
            {room.room?.code ?? '—'}
          </button>
          <span className="block text-[0.65rem] font-bold text-white/40">tap to copy link</span>
        </div>
        <div className="w-16" />
      </header>

      {room.connected === false && (room.room?.players.length ?? 0) === 0 && (
        <div className="mt-4 w-full max-w-md animate-pop rounded-2xl border-2 border-daisy/50 bg-[#ffd23f]/15 px-4 py-2 text-center text-sm font-bold text-cream">
          Connecting to the network… please wait
        </div>
      )}

      <div className="mt-6 grid w-full max-w-md grid-cols-[1fr_auto_1fr] items-center gap-2 animate-slide-up">
        <PlayerCard player={myPlayer} isMe ready={ready} />
        <div className="flex flex-col items-center gap-1 px-1">
          <span className="font-display text-4xl text-cream text-outline-thick">VS</span>
          <span className="chip">{(room.room?.players.length ?? 0)}/2</span>
        </div>
        <PlayerCard player={peer} isMe={false} ready={peer?.ready ?? false} />
      </div>

      {room.requests.length > 0 && (
        <div className="mt-4 w-full max-w-md animate-pop space-y-2">
          {room.requests.map((r) => (
            <div key={r.id} className="panel-solid flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2">
                <Character color="blue" state="idle" size={40} />
                <span className="font-bold text-cream">{r.name} wants to join!</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="arcade-btn arcade-btn--lime px-3 py-1 text-xs"
                  onClick={() => actions.acceptJoin(r.id)}
                >
                  Accept
                </button>
                <button
                  className="arcade-btn arcade-btn--p1 px-3 py-1 text-xs"
                  onClick={() => actions.declineJoin(r.id)}
                >
                  No
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex w-full max-w-md items-center justify-between gap-3 animate-slide-up">
        <div className="flex items-center gap-2 rounded-2xl border-2 border-white/20 bg-white/10 px-3 py-1.5">
          <span className="text-xs font-bold text-white/60">Name</span>
          <input
            defaultValue={me.name}
            maxLength={14}
            onBlur={(e) => saveIdentity({ name: e.target.value.trim() || me.name })}
            className="w-24 bg-transparent text-sm font-bold text-cream outline-none"
          />
        </div>
        <button
          className={`arcade-btn px-5 py-2 text-sm ${ready ? 'arcade-btn--daisy' : 'arcade-btn--lime'}`}
          onClick={() => {
            sound.play('pop');
            actions.toggleReady();
          }}
        >
          {ready ? 'Un-ready' : 'I’m ready'}
        </button>
      </div>

      <div className="mt-8 w-full max-w-4xl animate-slide-up">
        <div className="mb-3 flex items-center gap-3">
          <span className="h-1 flex-1 rounded-full bg-white/20" />
          <h2 className="font-display text-xl text-cream text-outline">Choose a game</h2>
          <span className="h-1 flex-1 rounded-full bg-white/20" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {GAMES.map((g) => (
            <GameCard
              key={g.id}
              gameId={g.id}
              onClick={() => {
                if (!peer) {
                  sound.play('hit');
                  return;
                }
                sound.play('go');
                void actions.startGame(g.id);
              }}
            />
          ))}
        </div>
      </div>

      <p className="mt-8 text-xs font-semibold text-white/40">
        {peer ? 'Tap a card to start the round · everyone sees the same game' : 'Waiting for a friend to join with your room code or invite link'}
      </p>
    </div>
  );
}
