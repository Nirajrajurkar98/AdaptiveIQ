import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, BookOpen, Check, Copy, LogOut, ShieldCheck, Users } from 'lucide-react';

type AccountRole = 'PLATFORM_ADMIN' | 'TEACHER' | 'STUDENT';
type AccountStatus = 'PENDING' | 'ACTIVE' | 'DEACTIVATED';
interface AuthUser { id: string; email: string; displayName: string; role: AccountRole; status: AccountStatus; }
interface AccountRow extends AuthUser { createdAt: string; }
const API = '/api/v1';

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',
    headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  });
  const payload = await response.json().catch(() => ({})) as { message?: string | string[] };
  if (!response.ok) {
    const message = Array.isArray(payload.message) ? payload.message.join(' ') : payload.message;
    throw new Error(message || 'The request could not be completed. Please try again.');
  }
  return payload as T;
}

function friendlyRole(role: AccountRole): string {
  return ({ PLATFORM_ADMIN: 'Platform administrator', TEACHER: 'Teacher', STUDENT: 'Student' })[role];
}

export default function AuthApp({ prototype }: { prototype: ReactNode }) {
  const [screen, setScreen] = useState<'loading' | 'login' | 'register' | 'bootstrap' | 'invite' | 'dashboard' | 'prototype'>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [teacherInvite, setTeacherInvite] = useState('');

  useEffect(() => {
    const inviteToken = new URLSearchParams(window.location.hash.slice(1)).get('teacherInvite');
    if (inviteToken) {
      setTeacherInvite(inviteToken);
      setScreen('invite');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    apiRequest<{ user: AuthUser }>('/auth/me').then(({ user: current }) => {
      setUser(current);
      if (!inviteToken) setScreen('dashboard');
    }).catch(() => { if (!inviteToken) setScreen('login'); });
  }, []);

  const signOut = useCallback(async () => {
    try { await apiRequest('/auth/logout', { method: 'POST' }); } catch { /* the local view still clears if the API is offline */ }
    setUser(null);
    setScreen('login');
  }, []);

  if (screen === 'prototype') return <div className="prototype-preview-shell"><div className="prototype-preview-banner"><BookOpen size={16} /><span><b>Prototype preview</b> — demo data and role preview are not an authenticated account.</span><button onClick={() => setScreen(user ? 'dashboard' : 'login')}>Return to {user ? 'account' : 'sign in'}</button></div>{prototype}</div>;
  if (screen === 'loading') return <main className="auth-loading" aria-live="polite">Loading your AdaptiveIQ account…</main>;
  if (screen === 'dashboard' && user) return <AuthenticatedWorkspace user={user} onLogout={signOut} onPreview={() => setScreen('prototype')} />;
  return <AuthPage
    screen={screen === 'dashboard' ? 'login' : screen}
    inviteToken={teacherInvite}
    onAuthenticated={(nextUser) => { setUser(nextUser); setScreen('dashboard'); }}
    onMode={setScreen}
    onPreview={() => setScreen('prototype')}
  />;
}

type AuthScreen = 'login' | 'register' | 'bootstrap' | 'invite';
function AuthPage({ screen, inviteToken, onAuthenticated, onMode, onPreview }: {
  screen: AuthScreen; inviteToken: string; onAuthenticated: (user: AuthUser) => void;
  onMode: (screen: 'login' | 'register' | 'bootstrap' | 'invite' | 'dashboard' | 'prototype') => void; onPreview: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const title = ({ login: 'Welcome back', register: 'Create your student account', bootstrap: 'Set up the platform administrator', invite: 'Activate your teacher account' } as const)[screen];

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const endpoint = ({ login: '/auth/login', register: '/auth/register', bootstrap: '/auth/bootstrap-admin', invite: '/auth/invitations/accept' } as const)[screen];
      const body = screen === 'login' ? { email, password }
        : screen === 'register' ? { name, email, password }
          : screen === 'bootstrap' ? { name, email, password, bootstrapSecret }
            : { name, password, invitationToken: inviteToken };
      const response = await apiRequest<{ user: AuthUser }>(endpoint, { method: 'POST', body: JSON.stringify(body) });
      onAuthenticated(response.user);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to complete sign in.'); }
    finally { setBusy(false); }
  };

  return <main className="auth-page">
    <section className="auth-intro">
      <div className="auth-brand"><span className="auth-brand-mark"><ShieldCheck size={20} /></span><span>adaptive<span>IQ</span></span></div>
      <div className="auth-intro-copy"><span className="auth-kicker">PRACTICE WITH PURPOSE</span><h1>Make every question a step forward.</h1><p>A focused space for students to practice and teachers to guide learning.</p></div>
      <div className="auth-intro-foot"><span>Secure sign in</span><i /> <span>Personal learning accounts</span></div>
    </section>
    <section className="auth-panel-wrap">
      <div className="auth-panel">
        <div className="auth-panel-heading"><div className="auth-role-mark">{screen === 'bootstrap' ? <ShieldCheck size={20} /> : screen === 'invite' ? <Users size={20} /> : <BookOpen size={20} />}</div><div><span className="auth-kicker">ADAPTIVEIQ ACCOUNT</span><h2>{title}</h2></div></div>
        <p className="auth-description">{screen === 'register' ? 'Student accounts can register here. Teacher accounts require an administrator invitation.' : screen === 'bootstrap' ? 'This private setup works only when the configured one-time secret is valid and no administrator exists.' : screen === 'invite' ? 'Choose your name and password to accept this single-use teacher invitation.' : 'Sign in to continue to your role-specific workspace.'}</p>
        <form className="auth-form" onSubmit={submit}>
          {screen !== 'login' && <label>Full name<input autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label>}
          {screen !== 'invite' && <label>Email address<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>}
          <label>Password<input type="password" autoComplete={screen === 'login' ? 'current-password' : 'new-password'} required minLength={screen === 'login' ? 1 : 12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />{screen !== 'login' && <small>Use at least 12 characters.</small>}</label>
          {screen === 'bootstrap' && <label>One-time administrator setup secret<input type="password" autoComplete="off" required minLength={32} maxLength={256} value={bootstrapSecret} onChange={(event) => setBootstrapSecret(event.target.value)} /><small>Set by the server operator in ADMIN_BOOTSTRAP_SECRET.</small></label>}
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : screen === 'login' ? 'Sign in' : screen === 'register' ? 'Create student account' : screen === 'bootstrap' ? 'Create first administrator' : 'Activate teacher account'}<ArrowRight size={17} /></button>
        </form>
        {screen === 'login' && <div className="auth-switch">New student? <button onClick={() => onMode('register')}>Create an account</button></div>}
        {screen === 'register' && <div className="auth-switch">Already registered? <button onClick={() => onMode('login')}>Sign in</button></div>}
        {screen === 'invite' && <div className="auth-switch">This link is private and can be used once.</div>}
        {screen === 'login' && <div className="auth-private-links"><button onClick={() => onMode('bootstrap')}>First administrator setup</button><span>·</span><button onClick={onPreview}>Open prototype preview</button></div>}
      </div>
      <div className="auth-privacy"><ShieldCheck size={15} /> Your role and account status are verified by the server.</div>
    </section>
  </main>;
}

function AuthenticatedWorkspace({ user, onLogout, onPreview }: { user: AuthUser; onLogout: () => void; onPreview: () => void }) {
  const navigation = useMemo(() => user.role === 'PLATFORM_ADMIN'
    ? [{ id: 'overview', label: 'Overview' }, { id: 'invitations', label: 'Teacher invitations' }, { id: 'users', label: 'User accounts' }]
    : [{ id: 'overview', label: 'Overview' }, { id: 'account', label: 'My account' }], [user.role]);
  const [section, setSection] = useState('overview');
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [accountsError, setAccountsError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteExpiry, setInviteExpiry] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [notice, setNotice] = useState('');

  const loadAccounts = useCallback(async () => {
    setAccountsError('');
    try { const result = await apiRequest<{ users: AccountRow[] }>('/admin/users'); setAccounts(result.users); }
    catch (reason) { setAccountsError(reason instanceof Error ? reason.message : 'Could not load accounts.'); }
  }, []);
  useEffect(() => { if (user.role === 'PLATFORM_ADMIN' && section === 'users') void loadAccounts(); }, [user.role, section, loadAccounts]);

  const createInvite = async (event: FormEvent) => {
    event.preventDefault(); setInviteError(''); setInviteUrl('');
    try {
      const result = await apiRequest<{ invitationUrl: string; expiresAt: string; delivery: 'NOT_CONFIGURED' }>('/admin/teacher-invitations', { method: 'POST', body: JSON.stringify({ email: inviteEmail }) });
      setInviteUrl(result.invitationUrl); setInviteExpiry(new Date(result.expiresAt).toLocaleString()); setInviteEmail('');
    } catch (reason) { setInviteError(reason instanceof Error ? reason.message : 'Could not create the invitation.'); }
  };

  const changeStatus = async (account: AccountRow) => {
    try {
      await apiRequest(`/admin/users/${encodeURIComponent(account.id)}/status`, { method: 'PATCH', body: JSON.stringify({ status: account.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE' }) });
      await loadAccounts(); setNotice('Teacher account status updated.');
    } catch (reason) { setAccountsError(reason instanceof Error ? reason.message : 'Could not update the account.'); }
  };

  return <div className="account-shell">
    <aside className="account-sidebar"><div className="auth-brand"><span className="auth-brand-mark"><ShieldCheck size={20} /></span><span>adaptive<span>IQ</span></span></div><div className="account-workspace-label">ACCOUNT WORKSPACE</div><nav aria-label="Account navigation">{navigation.map((item) => <button key={item.id} className={section === item.id ? 'selected' : ''} onClick={() => setSection(item.id)}>{item.label}</button>)}</nav><button className="account-preview-link" onClick={onPreview}><BookOpen size={16} /> Prototype preview</button><div className="account-user"><span>{user.displayName.trim().slice(0, 1).toUpperCase()}</span><div><b>{user.displayName}</b><small>{friendlyRole(user.role)}</small></div><button aria-label="Sign out" onClick={onLogout}><LogOut size={17} /></button></div></aside>
    <main className="account-main">
      <header className="account-topbar"><div><span>AdaptiveIQ</span><b>/ {navigation.find((item) => item.id === section)?.label ?? 'Overview'}</b></div><button onClick={onLogout}><LogOut size={16} /> Sign out</button></header>
      {section === 'overview' && <section className="account-content"><span className="auth-kicker">{friendlyRole(user.role).toUpperCase()}</span><h1>Welcome, {user.displayName.split(' ')[0]}.</h1><p>Your authenticated account is active. Account identity, role, and access are provided by the AdaptiveIQ API.</p><div className="account-summary"><div><small>ACCOUNT EMAIL</small><b>{user.email}</b></div><div><small>ROLE</small><b>{friendlyRole(user.role)}</b></div><div><small>STATUS</small><b className="status-active">Active</b></div></div>
        {user.role === 'PLATFORM_ADMIN' && <div className="account-info-panel"><h2>Platform administration</h2><p>Invite teacher accounts and manage teacher activation from the navigation.</p><button className="auth-submit" onClick={() => setSection('invitations')}>Create a teacher invitation <ArrowRight size={17} /></button></div>}
        {user.role !== 'PLATFORM_ADMIN' && <div className="account-info-panel"><h2>{user.role === 'TEACHER' ? 'Teacher workspace' : 'Student workspace'}</h2><p>{user.role === 'TEACHER' ? 'Your teacher account is active. Quiz and classroom tools will be added in later milestones.' : 'Your student account is ready. Quiz and classroom tools will be added in later milestones.'}</p><button className="secondary-auth-button" onClick={onPreview}>Explore the separate prototype preview</button></div>}
      </section>}
      {section === 'account' && <section className="account-content"><span className="auth-kicker">MY ACCOUNT</span><h1>Account details</h1><div className="account-summary"><div><small>NAME</small><b>{user.displayName}</b></div><div><small>EMAIL</small><b>{user.email}</b></div><div><small>ROLE</small><b>{friendlyRole(user.role)}</b></div></div></section>}
      {section === 'invitations' && user.role === 'PLATFORM_ADMIN' && <section className="account-content"><span className="auth-kicker">PLATFORM ADMINISTRATION</span><h1>Invite a teacher</h1><p>Create a single-use invitation link for a teacher. Email delivery is not configured; share the link securely with the intended recipient.</p><form className="admin-invite-form" onSubmit={createInvite}><label>Teacher email<input type="email" required maxLength={254} value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teacher@example.com" /></label><button className="auth-submit" type="submit">Create invitation <ArrowRight size={17} /></button></form>{inviteError && <div role="alert" className="auth-error">{inviteError}</div>}{inviteUrl && <div className="invite-result"><b>Invitation created · email not sent</b><p>This link expires {inviteExpiry} and can be accepted once.</p><label>Private invitation link<input readOnly value={inviteUrl} onFocus={(event) => event.currentTarget.select()} /></label><button className="secondary-auth-button" onClick={() => { if (!navigator.clipboard) { setNotice('Select and copy the invitation link.'); return; } void navigator.clipboard.writeText(inviteUrl).then(() => setNotice('Invitation link copied.')).catch(() => setNotice('Select and copy the invitation link.')); }}><Copy size={15} /> Copy invitation link</button></div>}</section>}
      {section === 'users' && user.role === 'PLATFORM_ADMIN' && <section className="account-content"><span className="auth-kicker">PLATFORM ADMINISTRATION</span><h1>User accounts</h1><p>Review registered accounts and activate or deactivate teacher access.</p>{accountsError && <div role="alert" className="auth-error">{accountsError}</div>}<div className="account-table"><div className="account-table-head"><span>NAME / EMAIL</span><span>ROLE</span><span>STATUS</span><span>ACCESS</span></div>{accounts.map((account) => <div className="account-table-row" key={account.id}><span><b>{account.displayName}</b><small>{account.email}</small></span><span>{friendlyRole(account.role)}</span><span>{account.status}</span><span>{account.role === 'TEACHER' && <button className="table-action" onClick={() => void changeStatus(account)}>{account.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</button>}</span></div>)}{accounts.length === 0 && !accountsError && <p className="account-empty">No accounts to show yet.</p>}</div></section>}
      {notice && <div role="status" className="account-notice"><Check size={16} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
    </main>
  </div>;
}
