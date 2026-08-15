import { useSyncExternalStore } from 'react';
import type { GameMoveEvent, NetEvent, RoomPlayer, RoomState, Unsubscribe } from './types';
import { SupabaseRealtimeTransport } from './supabaseTransport';
import { getIdentity, type PlayerIdentity } from './identity';

export type NetPhase =
  | 'idle'
  | 'creating'
  | 'pending'
  | 'lobby'
  | 'playing'
  | 'result';

export interface PendingRequest {
  id: string;
  name: string;
}

export interface RoomSnapshot {
  phase: NetPhase;
  room: RoomState | null;
  me: PlayerIdentity;
  connected: boolean;
  pending: boolean;
  declined: boolean;
  error: string | null;
  requests: PendingRequest[];
  myPlayer: RoomPlayer | null;
  isHost: boolean;
  peerGone: boolean;
  rematchReady: boolean;
}

const PENDING_TIMEOUT = 15000;

class RoomStore {
  private transport: SupabaseRealtimeTransport;
  private listeners = new Set<() => void>();
  private version = 0;
  private snap: RoomSnapshot = {
    phase: 'idle',
    room: null,
    me: getIdentity(),
    connected: false,
    pending: false,
    declined: false,
    error: null,
    requests: [],
    myPlayer: null,
    isHost: false,
    peerGone: false,
    rematchReady: false,
  };
  private pendingTimer: number | null = null;

  constructor() {
    this.transport = new SupabaseRealtimeTransport();

    this.transport.onEvent((e, fromId) => this.handleEvent(e, fromId));
    this.transport.onPlayers((players) => this.applyPlayers(players));
    this.transport.onConnection((connected) => this.patch({ connected }));
  }

  private emit() {
    this.version += 1;
    this.listeners.forEach((l) => l());
  }

  private patch(p: Partial<RoomSnapshot>) {
    this.snap = { ...this.snap, ...p };
    this.emit();
  }

  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  getSnapshot = () => this.snap;

  private get players(): RoomPlayer[] {
    return this.snap.room?.players ?? [];
  }

  private applyPlayers(players: RoomPlayer[]) {
    const me = this.snap.me;
    const roomState = this.snap.room;
    const code = roomState?.code ?? '';
    const gameId = roomState?.gameId ?? null;
    const myPlayer = players.find((p) => p.id === me.id) ?? null;
    const hostId = players.find((p) => p.role === 'host')?.id ?? (myPlayer?.role === 'host' ? me.id : '');
    const room: RoomState | null = roomState
      ? { ...roomState, hostId, players }
      : players.length
        ? { code, hostId, players, gameId }
        : null;

    const inSession = this.snap.phase === 'playing' || this.snap.phase === 'result';
    const peerGone = inSession && players.length < 2;

    // automatic rematch when every seated player voted
    const rematchReady =
      players.length >= 2 && players.every((p) => p.rematchVote);

    this.patch({ room, myPlayer, peerGone, rematchReady });
  }

  private handleEvent(e: NetEvent, fromId: string) {
    const me = this.snap.me;
    switch (e.type) {
      case 'join-request': {
        if (this.snap.isHost) {
          this.patch({
            requests: [...this.snap.requests.filter((r) => r.id !== fromId), { id: fromId, name: e.fromName }],
          });
        }
        break;
      }
      case 'join-response': {
        if (e.targetId !== me.id) return;
        if (e.accepted) {
          this.patch({ pending: false, phase: 'lobby' });
        } else {
          this.patch({ pending: false, declined: true, phase: 'idle' });
        }
        break;
      }
      case 'start-game': {
        this.patch({
          phase: 'playing',
          room: this.snap.room ? { ...this.snap.room, gameId: e.gameId } : this.snap.room,
        });
        break;
      }
      case 'rematch-vote': {
        // presence carries the vote; ignore direct event (kept for reliability)
        break;
      }
      case 'back-to-lobby': {
        this.patch({ phase: 'lobby', rematchReady: false, room: this.snap.room ? { ...this.snap.room, gameId: null } : this.snap.room });
        break;
      }
    }
  }

  // ---- actions -----------------------------------------------------------

  async createRoom() {
    this.patch({ phase: 'creating', declined: false, error: null });
    const res = await this.transport.createRoom();
    if (!res.ok || !res.code) {
      this.patch({ phase: 'idle', error: 'Could not create room' });
      return;
    }
    this.patch({ phase: 'lobby', pending: false, room: { code: res.code, hostId: this.snap.me.id, players: [], gameId: null } });
  }

  async joinRoom(code: string) {
    this.patch({ phase: 'creating', declined: false, error: null });
    const res = await this.transport.joinRoom(code);
    if (!res.ok) {
      const error =
        res.error === 'not-found'
          ? `Room ${code} not found`
          : res.error === 'full'
            ? 'Room is full'
            : 'Could not join room';
      this.patch({ phase: 'idle', error });
      return;
    }
    if (res.pending) {
      this.patch({ phase: 'pending', pending: true, room: { code: code.toUpperCase(), hostId: '', players: [], gameId: null } });
      this.startPendingTimer();
    } else {
      this.patch({ phase: 'lobby', pending: false, room: { code: code.toUpperCase(), hostId: '', players: [], gameId: null } });
    }
  }

  private startPendingTimer() {
    if (this.pendingTimer) window.clearTimeout(this.pendingTimer);
    this.pendingTimer = window.setTimeout(() => {
      if (this.snap.phase === 'pending') {
        this.patch({ pending: false, declined: true, phase: 'idle', error: 'No response from host' });
      }
    }, PENDING_TIMEOUT);
  }

  async acceptJoin(playerId: string) {
    if (this.players.length >= 2) {
      this.transport.send({ type: 'join-response', accepted: false, targetId: playerId });
    } else {
      this.transport.send({ type: 'join-response', accepted: true, targetId: playerId });
    }
    this.patch({ requests: this.snap.requests.filter((r) => r.id !== playerId) });
  }

  declineJoin(playerId: string) {
    this.transport.send({ type: 'join-response', accepted: false, targetId: playerId });
    this.patch({ requests: this.snap.requests.filter((r) => r.id !== playerId) });
  }

  toggleReady() {
    const ready = !(this.snap.myPlayer?.ready ?? false);
    this.transport.setPresence({ ready });
  }

  async startGame(gameId: string) {
    if (!this.snap.room) return;
    this.transport.setPresence({ ready: false, rematchVote: false });
    this.transport.send({ type: 'start-game', gameId });
    if (this.snap.isHost) {
      // persist to rooms table (ignored if table not provisioned)
      void this.transport.callRpc('set_room_game', { p_code: this.snap.room.code, p_game_id: gameId });
      void this.transport.callRpc('set_room_status', { p_code: this.snap.room.code, p_status: 'playing' });
    }
    this.patch({
      phase: 'playing',
      rematchReady: false,
      room: this.snap.room ? { ...this.snap.room, gameId } : this.snap.room,
    });
  }

  /** called when a new round starts (after countdown) */
  beginRound() {
    this.transport.setPresence({ rematchVote: false, ready: false });
    this.patch({ rematchReady: false });
  }

  finishRound() {
    this.patch({ phase: 'result' });
  }

  /** send a game move (used by playable games) */
  sendGameMove(event: GameMoveEvent) {
    this.transport.send(event);
  }

  /** subscribe to game moves from the peer (ignores own echoes) */
  onGameMove(cb: (move: GameMoveEvent, fromId: string) => void): Unsubscribe {
    return this.transport.onEvent((e, fromId) => {
      if (e.type === 'game-move') cb(e, fromId);
    });
  }

  async voteRematch() {
    this.transport.setPresence({ rematchVote: true });
    this.transport.send({ type: 'rematch-vote', fromId: this.snap.me.id, vote: true });
  }

  backToLobby() {
    this.transport.setPresence({ ready: false, rematchVote: false });
    this.transport.send({ type: 'back-to-lobby' });
  }

  dismissRequest(requestId: string) {
    this.patch({ requests: this.snap.requests.filter((r) => r.id !== requestId) });
  }

  clearError() {
    this.patch({ error: null });
  }

  leave() {
    this.transport.leave();
    if (this.pendingTimer) window.clearTimeout(this.pendingTimer);
    this.patch({
      phase: 'idle',
      room: null,
      pending: false,
      declined: false,
      error: null,
      requests: [],
      myPlayer: null,
      peerGone: false,
      rematchReady: false,
    });
  }
}

const store = new RoomStore();

export function getRoomStore() {
  return store;
}

export function useRoom(): RoomSnapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

export function useRoomActions() {
  return store; // actions are stable methods on the store
}
