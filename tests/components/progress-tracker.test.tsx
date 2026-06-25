import { render, fireEvent } from '@testing-library/preact';
import { describe, it, expect, beforeEach } from 'vitest';
import ProgressTracker from '../../src/components/ProgressTracker';
import { isComplete } from '../../src/components/progress-store';

describe('ProgressTracker', () => {
  beforeEach(() => localStorage.clear());
  it('toggles completion', () => {
    const { getByRole } = render(<ProgressTracker id="go-101/variables" />);
    fireEvent.click(getByRole('button'));
    expect(isComplete('go-101/variables')).toBe(true);
  });
});
