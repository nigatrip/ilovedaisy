export type GameCategory =
  | 'reaction'
  | 'physics'
  | 'racing'
  | 'sports'
  | 'combat'
  | 'board'
  | 'social';

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  reaction: 'Reaction',
  physics: 'Physics',
  racing: 'Racing',
  sports: 'Sports',
  combat: 'Combat',
  board: 'Board',
  social: 'Social',
};

export interface GameMeta {
  id: string;
  title: string;
  tagline: string;
  category: GameCategory;
  /** how long a round takes */
  round: string;
  /** 2-4 word control hint */
  controls: string;
}

export const GAMES: GameMeta[] = [
  {
    id: 'sumo',
    title: 'Sumo Push',
    tagline: 'Push your rival off the pad!',
    category: 'physics',
    round: '~30s',
    controls: 'Move · Push',
  },
  {
    id: 'tug',
    title: 'Tug of War',
    tagline: 'Pull with all your strength!',
    category: 'physics',
    round: '~20s',
    controls: 'Hold · Pull',
  },
  {
    id: 'football',
    title: 'Mini Football',
    tagline: 'First to score wins!',
    category: 'sports',
    round: '2 goals',
    controls: 'Move · Kick',
  },
  {
    id: 'tank',
    title: 'Tank Duel',
    tagline: 'Blast your rival!',
    category: 'combat',
    round: '3 hits',
    controls: 'Aim · Fire',
  },
  {
    id: 'race',
    title: 'Micro Race',
    tagline: 'Zoom to the finish line!',
    category: 'racing',
    round: '1 lap',
    controls: 'Steer · Boost',
  },
  {
    id: 'tictactoe',
    title: 'Tic Tac Toe',
    tagline: 'Classic three in a row!',
    category: 'board',
    round: '3 wins',
    controls: 'Tap a cell',
  },
  {
    id: 'connect4',
    title: 'Connect Four',
    tagline: 'Drop four in a row!',
    category: 'board',
    round: '1 game',
    controls: 'Pick a column',
  },
  {
    id: 'tapbattle',
    title: 'Tap Battle',
    tagline: 'Who can tap fastest?',
    category: 'reaction',
    round: '10s',
    controls: 'Tap, tap, tap!',
  },
];

export const GAME_BY_ID: Record<string, GameMeta> = Object.fromEntries(
  GAMES.map((g) => [g.id, g]),
);

/** first release playable set (wired after the room flow milestone) */
export const PLAYABLE: Record<string, boolean> = {
  sumo: true,
  tug: true,
  football: true,
  tank: true,
  race: true,
  tictactoe: true,
  connect4: true,
  tapbattle: true,
};
