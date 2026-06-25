import { render, fireEvent } from '@testing-library/preact';
import { describe, it, expect, beforeEach } from 'vitest';
import Quiz from '../../src/components/Quiz';

const q = [{ q: '2+2?', options: ['3', '4'], answer: 1 }];

describe('Quiz', () => {
  beforeEach(() => localStorage.clear());
  it('marks correct answer and persists score', () => {
    const { getByText } = render(<Quiz id="t/1" questions={q} />);
    fireEvent.click(getByText('4'));
    fireEvent.click(getByText('Submit'));
    expect(getByText(/1 \/ 1/)).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('msdz2h:v1')!).quizzes['t/1']).toEqual({ correct: 1, total: 1 });
  });
});
