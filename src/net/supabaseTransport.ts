import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import type { JoinOutcome, NetEvent, NetTransport, PlayerRole, RoomPlayer } from './types';
import { getIdentity } from './identity';

const BCAST_EVENT = 'ilovedaisy';

function localCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export class SupabaseRealtimeTransport implements NetTransport {
  readonly isReady: boolean;
  private client: SupabaseClient;
  private channel: RealtimeChannel | null = null;
  private code = '';
  private subscribed = false;
  private myPresence: RoomPlayer = { id: '', name: '', color: 'red', role: 'guest', ready: false, rematchVote: false };

  private eventCbs = new Set<(e: NetEvent, fromId: string) => void>();
  private playersCbs = new Set<(players: RoomPlayer[]) => void>();
  private connCbs = new Set<(connected: boolean) => void>();
  private connected = false;
  private opQueue: Promise<unknown> = Promise.resolve();

  /** serialize room operations so concurrent setup calls (e.g. StrictMode) can't double-subscribe a channel */
  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.opQueue.then(fn, fn);
    this.opQueue = run.catch(() => {});
    return run;
  }

  constructor() {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
    this.isReady = Boolean(url && key);
    this.client = createClient(url ?? '', key ?? '', {
      realtime: { params: { eventsPerSecond: 20 } },
    });
    window.setInterval(() => {
      if (!this.channel) return;
      const state = this.client.realtime.connectionState();
      // 'connecting' is transient (slow networks, reconnects); only report a
      // real drop when the socket is actually closing/closed.
      if (state === 'open') this.setConnected(true);
      else if (state === 'closing' || state === 'closed') this.setConnected(false);
    }, 2000);
  }

  private setConnected(connected: boolean) {
    if (this.connected === connected) return;
    this.connected = connected;
    this.connCbs.forEach((cb) => cb(connected));
  }

  private buildPlayers(): RoomPlayer[] {
    const state = this.channel?.presenceState() ?? {};
    const list: RoomPlayer[] = [];
    const seen = new Set<string>();
    for (const key of Object.keys(state)) {
      const p = state[key]?.[0] as Partial<RoomPlayer> | undefined;
      if (!p?.id || seen.has(p.id)) continue;
      seen.add(p.id);
      list.push({
        id: p.id,
        name: p.name ?? '',
        color: p.color === 'blue' ? 'blue' : 'red',
        role: p.role === 'guest' ? 'guest' : 'host',
        ready: Boolean(p.ready),
        rematchVote: Boolean(p.rematchVote),
      });
    }
    list.sort((a, b) => (a.role === 'host' ? -1 : b.role === 'host' ? 1 : a.id.localeCompare(b.id)));
    return list;
  }

  /** drop the current channel and reset state so a room can be joined cleanly */
  private cleanup() {
    try {
      this.channel?.untrack();
    } catch {
      /* ignore */
    }
    try {
      this.channel?.unsubscribe();
    } catch {
      /* ignore */
    }
    this.channel = null;
    this.code = '';
    this.subscribed = false;
    this.setConnected(false);
  }

  private async setup(code: string, role: PlayerRole): Promise<void> {
    const me = getIdentity();
    this.myPresence = { id: me.id, name: me.name, color: role === 'host' ? 'red' : 'blue', role, ready: false, rematchVote: false };
    this.code = code;

    let lastStatus = '';
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      // aborted by leave() while retrying (leave() clears this.code)
      if (this.code !== code) throw new Error('aborted');

      const channel = this.client.channel(`room:${code}`);
      this.channel = channel;
      this.subscribed = false;
      channel
        .on('presence', { event: 'sync' }, () => {
          this.playersCbs.forEach((cb) => cb(this.buildPlayers()));
        })
        .on('broadcast', { event: BCAST_EVENT }, (payload) => {
          const e = (payload as { payload?: NetEvent & { fromId?: string } }).payload;
          if (e) {
            const fromId = e.fromId ?? '';
            this.eventCbs.forEach((cb) => cb(e, fromId));
          }
        });

      const ok = await new Promise<boolean>((resolve) => {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.subscribed = true;
            this.setConnected(true);
            channel.track(this.myPresence).catch(() => {});
            resolve(true);
          } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            lastStatus = status;
            // a timed-out/failed subscribe leaves the channel unusable → retry on a fresh one
            channel.unsubscribe().catch(() => {});
            resolve(false);
          }
        });
      });

      if (ok) return;
      if (attempt < 3) {
        await new Promise((r) => window.setTimeout(r, 700 * attempt));
        continue;
      }
    }
    this.cleanup();
    throw new Error(lastStatus || 'subscribe failed');
  }

  private isFull(): boolean {
    return this.buildPlayers().length >= 2;
  }

  async createRoom(): Promise<{ ok: boolean; code?: string; error?: string }> {
    return this.enqueue(async () => {
      if (this.code && this.channel && this.subscribed) return { ok: true, code: this.code };
      const me = getIdentity();
      let code: string | undefined;
      try {
        const { data, error } = await this.client.rpc('create_room', { p_host_id: me.id });
        if (error) throw error;
        code = data as string;
      } catch {
        // rooms table not provisioned yet → ephemeral room (presence only)
        console.warn('[net] rooms table unavailable, using ephemeral room');
        code = localCode();
      }
      try {
        await this.setup(code, 'host');
        return { ok: true, code };
      } catch (err) {
        console.error('[net] createRoom setup failed:', err);
        this.cleanup();
        return { ok: false, error: 'unknown' };
      }
    });
  }

  async joinRoom(rawCode: string): Promise<JoinOutcome> {
    return this.enqueue(async () => {
      const code = rawCode.toUpperCase().slice(0, 6);
      let hostId: string | null = null;
      try {
        const { data, error } = await this.client.rpc('get_room', { p_code: code });
        if (error) throw error;
        hostId = data?.length ? (data[0] as { host_id: string }).host_id : null;
      } catch {
        hostId = null; // ephemeral mode
      }
      if (this.code && this.code !== code) this.leave();

      if (this.code === code && this.subscribed) {
        // already joined this room (e.g. React StrictMode re-running the effect)
        return { ok: true };
      }

      const me = getIdentity();
      const role: PlayerRole = hostId === me.id ? 'host' : 'guest';

      try {
        await this.setup(code, role);
      } catch (err) {
        console.error('[net] joinRoom setup failed:', err);
        this.cleanup();
        return { ok: false, error: 'unknown' };
      }

      if (this.isFull() && role === 'guest') {
        // ask the host for a seat
        this.send({ type: 'join-request', fromId: me.id, fromName: me.name });
        return { ok: true, pending: true };
      }
      return { ok: true };
    });
  }

  setPresence(patch: Partial<Omit<RoomPlayer, 'id'>>) {
    this.myPresence = { ...this.myPresence, ...patch };
    this.channel?.track(this.myPresence);
  }

  /** thin wrapper so the store can persist to the rooms table when provisioned */
  async callRpc(name: string, args: Record<string, unknown>): Promise<boolean> {
    try {
      const { error } = await this.client.rpc(name, args);
      return !error;
    } catch {
      return false;
    }
  }

  send(event: NetEvent) {
    this.channel?.send({ type: 'broadcast', event: BCAST_EVENT, payload: event }).catch(() => {});
  }

  leave() {
    this.cleanup();
  }

  onEvent(cb: (e: NetEvent, fromId: string) => void): () => void {
    this.eventCbs.add(cb);
    return () => this.eventCbs.delete(cb);
  }

  onPlayers(cb: (players: RoomPlayer[]) => void): () => void {
    this.playersCbs.add(cb);
    return () => this.playersCbs.delete(cb);
  }

  onConnection(cb: (connected: boolean) => void): () => void {
    this.connCbs.add(cb);
    cb(this.connected); // sync current state so late subscribers can't get stuck on a stale value
    return () => this.connCbs.delete(cb);
  }

  destroy() {
    this.leave();
    this.eventCbs.clear();
    this.playersCbs.clear();
    this.connCbs.clear();
    void this.client.removeAllChannels();
  }
}
