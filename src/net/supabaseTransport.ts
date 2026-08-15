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
  private myPresence: Omit<RoomPlayer, 'id'> = { name: '', color: 'red', role: 'guest', ready: false, rematchVote: false };

  private eventCbs = new Set<(e: NetEvent, fromId: string) => void>();
  private playersCbs = new Set<(players: RoomPlayer[]) => void>();
  private connCbs = new Set<(connected: boolean) => void>();
  private connected = false;

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
      this.setConnected(state === 'open');
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
    for (const key of Object.keys(state)) {
      const p = state[key]?.[0] as Partial<RoomPlayer> | undefined;
      if (!p?.id) continue;
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

  private async setup(code: string, role: PlayerRole): Promise<void> {
    this.code = code;
    const me = getIdentity();
    this.myPresence = { name: me.name, color: role === 'host' ? 'red' : 'blue', role, ready: false, rematchVote: false };

    this.channel = this.client.channel(`room:${code}`);
    this.channel
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

    await new Promise<void>((resolve, reject) => {
      let done = false;
      const finish = (fn: () => void) => () => {
        if (done) return;
        done = true;
        fn();
      };
      const outer = window.setTimeout(
        () => finish(() => reject(new Error('channel timeout')))(),
        60000,
      );
      this.channel?.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.setConnected(true);
          this.channel?.track(this.myPresence);
          finish(() => {
            window.clearTimeout(outer);
            resolve();
          })();
        }
      });
    });
  }

  private isFull(): boolean {
    return this.buildPlayers().length >= 2;
  }

  async createRoom(): Promise<{ ok: boolean; code?: string; error?: string }> {
    if (this.code && this.channel) return { ok: true, code: this.code };
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
      return { ok: false, error: 'unknown' };
    }
  }

  async joinRoom(rawCode: string): Promise<JoinOutcome> {
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

    if (this.code === code) {
      // already joined this room (e.g. React StrictMode re-running the effect)
      return { ok: true };
    }

    const me = getIdentity();
    const role: PlayerRole = hostId === me.id ? 'host' : 'guest';

    try {
      await this.setup(code, role);
    } catch (err) {
      console.error('[net] joinRoom setup failed:', err);
      return { ok: false, error: 'unknown' };
    }

    if (this.isFull() && role === 'guest') {
      // ask the host for a seat
      this.send({ type: 'join-request', fromId: me.id, fromName: me.name });
      return { ok: true, pending: true };
    }
    return { ok: true };
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
    this.setConnected(false);
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
