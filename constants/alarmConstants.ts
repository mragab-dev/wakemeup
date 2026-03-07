
import { Challenge, ChallengeType } from '@/types';

export const DEFAULT_CHALLENGE_SETTINGS: Challenge = {
  type: ChallengeType.NONE,
  config: null,
};

export const SNOOZE_DURATIONS_MINUTES = [5, 10, 15, 20, 30];
export const MAX_SNOOZE_COUNTS = [1, 2, 3, 5, 10];

export const CHALLENGE_DIFFICULTY_LEVELS = [1, 2, 3, 4, 5];
export const WORD_PUZZLE_DIFFICULTY_LEVELS = [1, 2, 3, 4, 5];
export const MATH_CHALLENGE_QUESTIONS_COUNT = [1, 2, 3, 5, 8];
