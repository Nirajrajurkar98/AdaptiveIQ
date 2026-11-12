import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuthApp from './AuthApp';

const response = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

describe('authenticated account experience', () => {
  beforeEach(() => { vi.restoreAllMocks(); window.history.replaceState(null, '', '/'); });

  it('keeps account pages behind sign-in and clearly labels the separate prototype preview', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(401, { message: 'Please sign in.' })));
    render(<AuthApp prototype={<div>Mock quiz prototype</div>} />);
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.queryByText('User accounts')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /open prototype preview/i }));
    expect(screen.getByText(/prototype preview/i)).toBeInTheDocument();
    expect(screen.getByText('Mock quiz prototype')).toBeInTheDocument();
  });

  it('registers through the API and keeps the role preview outside authenticated accounts', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(401, { message: 'Unauthenticated.' }))
      .mockResolvedValueOnce(response(201, { user: { id: 's1', email: 'student@example.com', displayName: 'New Student', role: 'STUDENT', status: 'ACTIVE' } }));
    vi.stubGlobal('fetch', fetchMock);
    render(<AuthApp prototype={<div>Mock quiz prototype</div>} />);
    fireEvent.click(await screen.findByRole('button', { name: /create an account/i }));
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'New Student' } });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'student@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'a-strong-student-password' } });
    fireEvent.click(screen.getByRole('button', { name: /create student account/i }));
    expect(await screen.findByRole('heading', { name: /welcome, new/i })).toBeInTheDocument();
    expect(screen.getByText('STUDENT', { exact: true })).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/auth/register');
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ name: 'New Student', email: 'student@example.com', password: 'a-strong-student-password' });
    expect(JSON.stringify(fetchMock.mock.calls[1][1]?.body)).not.toContain('role');
  });

  it('shows platform-admin navigation only for the server-reported administrator role', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, { user: { id: 'a1', email: 'admin@example.com', displayName: 'Admin User', role: 'PLATFORM_ADMIN', status: 'ACTIVE' } })));
    render(<AuthApp prototype={<div>Mock quiz prototype</div>} />);
    expect(await screen.findByRole('button', { name: 'Teacher invitations' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'User accounts' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign out' })[0]);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument());
  });
});
