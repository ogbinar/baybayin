import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from '../../src/App';

describe('Pantig app', () => {
  it('starts with the pronunciation-aware Michel example', () => {
    render(<App />);
    expect(screen.getByTestId('baybayin-result')).toHaveTextContent('ᜋᜒᜐ᜕ᜌᜒᜎ᜕');
    expect(screen.getByLabelText('Phonetic spelling')).toHaveValue('misyel');
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
    fireEvent.click(screen.getByRole('button', { name: 'Show pronunciations' }));
    expect(screen.getByText(/Use Latin letters/)).toBeVisible();
  });

  it('offers vertical flow and multiple image backgrounds', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: /Stacked/ }));
    fireEvent.click(screen.getByRole('radio', { name: 'Paper' }));
    expect(screen.getByTestId('glyph-preview')).toHaveClass('flow-vertical');
    expect(screen.getByTestId('glyph-preview')).toHaveClass('background-paper');
  });

  it('switches and remembers the color theme', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(window.localStorage.getItem('pantig-theme')).toBe('dark');
  });

  it('links to the compact external source set', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'National Museum of the Philippines' })).toHaveAttribute(
      'href',
      'https://www.nationalmuseum.gov.ph/exhibitions/anthropology/baybayin/',
    );
    expect(screen.getByRole('link', { name: 'Unicode Standard' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'NCCA Philippine History Source Book' })).toBeVisible();
  });

  it('links to the public source code', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'View the code on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/ogbinar/baybayin',
    );
  });
});
