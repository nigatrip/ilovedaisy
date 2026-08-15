import type { CharacterExpression, CharacterPose, CharacterState } from './characterTypes';

/**
 * Angle convention: 0deg = limb hanging straight down.
 * Positive = clockwise (SVG rotate). With the character facing +x (right):
 *   -90deg  -> reaching forward (horizontal +x)
 *   +180deg -> straight up
 *   +35deg  -> kicked forward (toward +x, slightly down)
 */

const IDLE: CharacterPose = {
  tilt: 0,
  sx: 1,
  sy: 1,
  dy: 0,
  headRot: 0,
  headDy: 0,
  bodyRot: 0,
  armL: 8,
  armR: -8,
  legL: 0,
  legR: 0,
  anim: 'bob',
  expression: 'normal',
};

const RUN: CharacterPose = {
  tilt: -7,
  sx: 1,
  sy: 1.02,
  dy: 0,
  headRot: -4,
  headDy: 0,
  bodyRot: 0,
  armL: 0,
  armR: 0,
  legL: 0,
  legR: 0,
  anim: 'runBob',
  expression: 'determined',
};

const JUMP: CharacterPose = {
  tilt: -4,
  sx: 0.95,
  sy: 1.12,
  dy: 0,
  headRot: -2,
  headDy: -2,
  bodyRot: 0,
  armL: 195,
  armR: 165,
  legL: 38,
  legR: 34,
  anim: 'none',
  expression: 'happy',
};

const PUSH: CharacterPose = {
  tilt: 0,
  sx: 1.04,
  sy: 0.98,
  dy: 0,
  headRot: 4,
  headDy: -1,
  bodyRot: 7,
  armL: -84,
  armR: -68,
  legL: -22,
  legR: 30,
  anim: 'none',
  expression: 'determined',
};

const PULL: CharacterPose = {
  tilt: 0,
  sx: 1.02,
  sy: 1,
  dy: 0,
  headRot: -6,
  headDy: 0,
  bodyRot: -9,
  armL: 150,
  armR: 175,
  legL: -30,
  legR: 22,
  anim: 'none',
  expression: 'determined',
};

const ATTACK: CharacterPose = {
  tilt: -6,
  sx: 1.06,
  sy: 1,
  dy: 0,
  headRot: -4,
  headDy: -1,
  bodyRot: 0,
  armL: -112,
  armR: 40,
  legL: -14,
  legR: 28,
  anim: 'none',
  expression: 'determined',
};

const FALL: CharacterPose = {
  tilt: 38,
  sx: 1.06,
  sy: 0.82,
  dy: 4,
  headRot: -22,
  headDy: -3,
  bodyRot: 0,
  armL: 160,
  armR: 150,
  legL: 55,
  legR: 40,
  anim: 'none',
  expression: 'surprised',
};

const CELEBRATE: CharacterPose = {
  tilt: 0,
  sx: 1,
  sy: 1,
  dy: 0,
  headRot: 0,
  headDy: 0,
  bodyRot: 0,
  armL: 185,
  armR: 175,
  legL: 10,
  legR: -10,
  anim: 'celebrate',
  expression: 'happy',
};

const LOSE: CharacterPose = {
  tilt: 0,
  sx: 1,
  sy: 0.94,
  dy: 2,
  headRot: 8,
  headDy: 6,
  bodyRot: 0,
  armL: 22,
  armR: -16,
  legL: 4,
  legR: -2,
  anim: 'loseBob',
  expression: 'sad',
};

export const POSES: Record<CharacterState, CharacterPose> = {
  idle: IDLE,
  run: RUN,
  jump: JUMP,
  push: PUSH,
  pull: PULL,
  attack: ATTACK,
  fall: FALL,
  celebrate: CELEBRATE,
  lose: LOSE,
};

export const EXPRESSIONS: Record<CharacterExpression, string> = {
  normal: 'normal',
  happy: 'happy',
  surprised: 'surprised',
  determined: 'determined',
  sad: 'sad',
  cross: 'cross',
};
