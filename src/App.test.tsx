import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider, useApp } from './state/AppContext';
import { Toast } from './components/ui/Toast';

// The app never reaches the network in this test; it only needs a context.
vi.mock('./api/auth', () => ({
  authApi: { me: vi.fn().mockResolvedValue(null), logout: vi.fn() },
}));
vi.mock('./api/notifications', () => ({
  notificationsApi: { list: vi.fn().mockResolvedValue([]) },
}));

/**
 * The toast has to be rendered above the router, not inside a shell.
 *
 * It used to live only in LearnerShell, so every message raised anywhere else
 * was silently discarded — a wrong password on /login, a 500 from the API, the
 * "no access" a route guard shows before redirecting. The state changed and
 * nothing drew it, which looks exactly like a dead button.
 */
const GlobalToast: React.FC = () => {
  const { toast } = useApp();
  return <Toast toast={toast} />;
};

const Raiser: React.FC<{ message: string }> = ({ message }) => {
  const { showToast } = useApp();
  return (
    <button type="button" onClick={() => showToast(message, 'error')}>
      raise
    </button>
  );
};

describe('the global toast', () => {
  it('shows a message raised outside any shell', async () => {
    render(
      <AppProvider>
        <GlobalToast />
        <Raiser message="شماره موبایل یا کلمه عبور اشتباه است." />
      </AppProvider>
    );

    expect(screen.queryByRole('alert')).toBeNull();

    await act(async () => {
      screen.getByText('raise').click();
    });

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('شماره موبایل یا کلمه عبور اشتباه است.');
  });

  it('is mounted by App above the router, so every route can reach it', async () => {
    const source = await import('node:fs').then((fs) => fs.readFileSync('src/App.tsx', 'utf8'));
    expect(source).toContain('<GlobalToast />');

    // And is not left duplicated inside the learner shell.
    const shell = await import('node:fs').then((fs) =>
      fs.readFileSync('src/shells/LearnerShell.tsx', 'utf8')
    );
    expect(shell).not.toContain('<Toast');
  });
});
