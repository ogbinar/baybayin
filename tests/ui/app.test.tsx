import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import App from '../../src/App';

describe('Pantig app', () => {
  function openPronunciation() {
    fireEvent.click(screen.getByRole('button', { name: 'Show me' }));
  }

  function revealMisyel() {
    openPronunciation();
    fireEvent.click(screen.getByRole('button', { name: /Misyel/ }));
  }

  it('starts with the name before revealing a result', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'What’s your name?' })).toBeVisible();
    expect(screen.getByLabelText('Your name')).toHaveValue('Michel');
    expect(screen.queryByTestId('baybayin-result')).not.toBeInTheDocument();
  });

  it('confirms pronunciation before revealing the Baybayin result', () => {
    render(<App />);
    openPronunciation();
    expect(screen.getByRole('heading', { name: 'How do you say Michel?' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Misyel/ }));
    expect(screen.getByTestId('baybayin-result')).toHaveTextContent('ᜋᜒᜐ᜕ᜌᜒᜎ᜕');
    expect(screen.getByLabelText('How the name became Baybayin')).toHaveTextContent('mi · syel');
  });

  it('shows an actionable validation error', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Show me' }));
    expect(screen.getByText(/Use Latin letters/)).toBeVisible();
  });

  it('keeps advanced writing and image choices optional', () => {
    render(<App />);
    revealMisyel();
    expect(screen.getByText('Writing and image options').closest('details')).not.toHaveAttribute('open');
    fireEvent.click(screen.getByText('Writing and image options'));
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

  it('copies share text when native sharing is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    render(<App />);
    revealMisyel();
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Michel in Baybayin')));
    expect(screen.getByRole('status')).toHaveTextContent('Share text copied.');
  });
});
