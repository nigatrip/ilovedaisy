import type { CharacterColor } from './characterTypes';

export interface CharacterPalette {
  name: string;
  /** main body color */
  base: string;
  /** top highlight */
  light: string;
  /** bottom shading */
  dark: string;
  /** deepest edge shading */
  deep: string;
  /** belly / inner-ear lighter tone */
  belly: string;
  /** player-facing accent label */
  label: string;
}

export const PALETTES: Record<CharacterColor, CharacterPalette> = {
  red: {
    name: 'Rosa',
    base: '#ff4d5e',
    light: '#ff8b94',
    dark: '#e0344a',
    deep: '#a52638',
    belly: '#ffc2c9',
    label: 'P1',
  },
  blue: {
    name: 'Sky',
    base: '#31a8ff',
    light: '#7cc8ff',
    dark: '#1d7be0',
    deep: '#144ba6',
    belly: '#c2e6ff',
    label: 'P2',
  },
  green: {
    name: 'Leaf',
    base: '#57d95f',
    light: '#9aeea0',
    dark: '#2eb349',
    deep: '#1a8a35',
    belly: '#d2f8cf',
    label: 'P3',
  },
  yellow: {
    name: 'Sunny',
    base: '#ffd23f',
    light: '#ffe98a',
    dark: '#f5a623',
    deep: '#c77d12',
    belly: '#fff3c2',
    label: 'P4',
  },
  purple: {
    name: 'Violet',
    base: '#b06cff',
    light: '#d1a5ff',
    dark: '#7c34e0',
    deep: '#5518a8',
    belly: '#ecd9ff',
    label: 'P5',
  },
  pink: {
    name: 'Blossom',
    base: '#ff6fce',
    light: '#ffb2e4',
    dark: '#e040a8',
    deep: '#a52a80',
    belly: '#ffddf2',
    label: 'P6',
  },
};

export const OUTLINE = '#2a1a55';
