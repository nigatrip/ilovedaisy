export type CharacterColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'pink';

export type CharacterState =
  | 'idle'
  | 'run'
  | 'jump'
  | 'push'
  | 'pull'
  | 'attack'
  | 'fall'
  | 'celebrate'
  | 'lose';

export type CharacterExpression =
  | 'normal'
  | 'happy'
  | 'surprised'
  | 'determined'
  | 'sad'
  | 'cross';

export interface CharacterPose {
  /** root rotation in degrees (whole character tilt) */
  tilt: number;
  /** root squash/stretch */
  sx: number;
  sy: number;
  /** root vertical offset */
  dy: number;
  /** head rotation + offset around neck pivot */
  headRot: number;
  headDy: number;
  /** body rotation around chest pivot */
  bodyRot: number;
  /** arm angles around shoulder pivot, degrees */
  armL: number;
  armR: number;
  /** leg angles around hip pivot, degrees */
  legL: number;
  legR: number;
  /** optional root bob class for looping states */
  anim: 'none' | 'bob' | 'runBob' | 'celebrate' | 'loseBob';
  expression: CharacterExpression;
}
