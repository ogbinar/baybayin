import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from '../../src/App';

describe('Pantig app', () => {
  it('starts with the pronunciation-aware Angelica example', () => {
    render(<App />);
    expect(screen.getByTestId('baybayin-result')).toHaveTextContent('ᜀᜈ᜕ᜇᜒᜌᜒᜎᜒᜃ');
    expect(screen.getByLabelText('Phonetic spelling')).toHaveValue('andiyelika');
  });

  it('updates immediately when the phonetic spelling changes', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Phonetic spelling'), {
      target: { value: 'mark' },
    });
    expect(screen.getByTestId('baybayin-result')).toHaveTextContent('ᜋᜍ᜕ᜃ᜕');
  });

  it('shows an actionable validation error', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Find its form' }));
    expect(screen.getByText(/Use Latin letters/)).toBeVisible();
  });
});
