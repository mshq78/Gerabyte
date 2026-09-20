import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LoginScreen } from './LoginScreen';

// The screen only needs these three from the app context, and none of them is
// called while it is simply sitting there waiting for a phone number.
vi.mock('../../state/AppContext', () => ({
  useApp: () => ({
    refreshMe: vi.fn(),
    updateMe: vi.fn(),
    showToast: vi.fn(),
  }),
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginScreen />
    </MemoryRouter>
  );
}

describe('LoginScreen', () => {
  it('starts with an empty phone field', () => {
    renderLogin();
    const phone = screen.getByLabelText('شماره تلفن همراه:') as HTMLInputElement;
    // It used to arrive pre-filled with a developer's own number, which is a
    // mock default that has no business on a sign-in screen.
    expect(phone.value).toBe('');
  });

  it('shows the format as a placeholder rather than as a value', () => {
    renderLogin();
    const phone = screen.getByLabelText('شماره تلفن همراه:') as HTMLInputElement;
    expect(phone.placeholder).toBe('۰۹۱۲۳۴۵۶۷۸۹');
  });

  it('asks the phone keypad for a telephone number', () => {
    renderLogin();
    const phone = screen.getByLabelText('شماره تلفن همراه:') as HTMLInputElement;
    expect(phone.getAttribute('inputmode')).toBe('tel');
    expect(phone.getAttribute('autocomplete')).toBe('tel');
    expect(phone.type).toBe('tel');
  });

  it('carries no pre-filled credential anywhere on the screen', () => {
    const { container } = renderLogin();
    for (const input of container.querySelectorAll('input')) {
      expect(input.value, input.id || input.type).toBe('');
    }
  });
});
