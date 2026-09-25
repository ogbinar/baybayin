import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import App from '../../src/App';

describe('Pantig app', () => {
  function revealDefault() {
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Michel' } });
    fireEvent.click(screen.getByRole('button', { name: 'Show me' }));
  }

  it('starts with one blank name input and no result', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'See your name in Baybayin.' })).toBeVisible();
    expect(screen.getByLabelText('Your name')).toHaveValue('');
    expect(screen.getByLabelText('Your name')).toHaveAttribute('placeholder', 'Michel');
    expect(screen.queryByTestId('baybayin-result')).not.toBeInTheDocument();
  });

  it('shows the recommended result immediately after one submission', () => {
    render(<App />);
    revealDefault();
    expect(screen.queryByRole('heading', { name: 'How do you say Michel?' })).not.toBeInTheDocument();
    expect(screen.getByTestId('baybayin-result')).toHaveTextContent('ᜋᜒᜐ᜕ᜌᜒᜎ᜕');
    expect(screen.getByText('We read this as:')).toHaveTextContent('Misyel');
    expect(screen.getByLabelText('How the name became Baybayin')).toHaveTextContent('Misyel');
    expect(screen.getByLabelText('How the name became Baybayin')).toHaveTextContent('mi · syel');
  });

  it('shows an actionable validation error without revealing a result', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Show me' }));
    expect(screen.getByText(/Use Latin letters/)).toBeVisible();
    expect(screen.queryByTestId('baybayin-result')).not.toBeInTheDocument();
  });

  it('changes a pronunciation inline and updates the result', () => {
    render(<App />);
    revealDefault();
    fireEvent.click(screen.getByRole('button', { name: 'Change pronunciation' }));
    expect(screen.getByText(/Choose the closest pronunciation/)).toBeVisible();
    fireEvent.click(screen.getByRole('radio', { name: /Mikel/ }));
    expect(screen.getByTestId('baybayin-result')).toHaveTextContent('ᜋᜒᜃᜒᜎ᜕');
    expect(screen.getByText('We read this as:')).toHaveTextContent('Mikel');
    expect(screen.queryByText(/Choose the closest pronunciation/)).not.toBeInTheDocument();
  });

  it('keeps the last valid result when a manual pronunciation is invalid', () => {
    render(<App />);
    revealDefault();
    fireEvent.click(screen.getByRole('button', { name: 'Change pronunciation' }));
    fireEvent.change(screen.getByLabelText('Phonetic spelling'), { target: { value: 'myk' } });
    fireEvent.click(screen.getByRole('button', { name: 'Use this sound' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/vowel/i);
    expect(screen.getByTestId('baybayin-result')).toHaveTextContent('ᜋᜒᜐ᜕ᜌᜒᜎ᜕');
  });

  it('keeps education and advanced choices progressively disclosed', () => {
    render(<App />);
    revealDefault();
    expect(screen.getByText('Why is it written this way?').closest('details')).not.toHaveAttribute('open');
    expect(screen.getByText('More options').closest('details')).not.toHaveAttribute('open');

    fireEvent.click(screen.getByText('Why is it written this way?'));
    expect(screen.getByText(/Pantig split “Misyel”/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Explain mi' }));
    expect(screen.getByText(/writes “mi”/)).toBeVisible();

    fireEvent.click(screen.getByText('More options'));
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

  it('links to sources and public code', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'National Museum of the Philippines' })).toHaveAttribute(
      'href',
      'https://www.nationalmuseum.gov.ph/exhibitions/anthropology/baybayin/',
    );
    expect(screen.getByRole('link', { name: 'Unicode Standard' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'NCCA Philippine History Source Book' })).toBeVisible();
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
    revealDefault();
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Michel in Baybayin')));
    expect(screen.getByText('Share text copied.')).toBeVisible();
  });
});
