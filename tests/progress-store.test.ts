import { describe, it, expect, beforeEach } from 'vitest';
import { markComplete, isComplete, getCompleted, saveQuizScore, getQuizScore } from '../src/components/progress-store';

describe('progress-store', () => {
  beforeEach(() => localStorage.clear());

  it('marks a lesson complete and reads it back', () => {
    expect(isComplete('go-101/variables')).toBe(false);
    markComplete('go-101/variables');
    expect(isComplete('go-101/variables')).toBe(true);
    expect(getCompleted()).toContain('go-101/variables');
  });

  it('persists quiz scores', () => {
    saveQuizScore('go-101/variables', 3, 4);
    expect(getQuizScore('go-101/variables')).toEqual({ correct: 3, total: 4 });
  });
});
