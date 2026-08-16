export type PlayerColor = 'red' | 'blue';
export type PlayerRole = 'host' | 'guest';

export interface RoomPlayer {
  id: string;
  name: string;
  color: PlayerColor;
  role: PlayerRole;
  ready: boolean;
  rematchVote: boolean;
}

export interface RoomState {
  code: string;
  hostId: string;
  players: RoomPlayer[];
  gameId: string | null;
}

/** Events exchanged between clients over the room channel. */
export type NetEvent =
  | { type: 'join-request'; fromId: string; fromName: string }
  | { type: 'join-response'; accepted: boolean; targetId: string }
  | { type: 'start-game'; gameId: string }
  | { type: 'rematch-vote'; fromId: string; vote: boolean }
  | { type: 'back-to-lobby' }
  | { type: 'game-move'; game: string; round: number; payload: Record<string, unknown>; fromId: string };

/** A game move event (used by playable games). */
export type GameMoveEvent = Extract<NetEvent, { type: 'game-move' }>;

export interface JoinOutcome {
  ok: boolean;
  pending?: boolean;
  error?: 'not-found' | 'full' | 'declined' | 'no-response' | 'unknown';
}

export interface NetTransport {
  /** true once the Supabase client is configured */
  readonly isReady: boolean;
  createRoom(): Promise<{ ok: boolean; code?: string; error?: string }>;
  joinRoom(code: string): Promise<JoinOutcome>;
  /** track/update my presence fields */
  setPresence(patch: Partial<Omit<RoomPlayer, 'id'>>): void;
  send(event: NetEvent): void;
  leave(): void;
  onEvent(cb: (e: NetEvent, fromId: string) => void): () => void;
  onPlayers(cb: (players: RoomPlayer[]) => void): () => void;
  onConnection(cb: (connected: boolean) => void): () => void;
  destroy(): void;
}

export type Unsubscribe = () => void;
