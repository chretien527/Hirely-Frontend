'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { ThemeToggle } from '../../components/ui';

export default function LoginPage() {
  const { user, loading: authLoading, login, register, logout } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('employer');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', company: '', jobTitle: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('Enter your email and request a verification code.');
  const [resendTimer, setResendTimer] = useState(0);

  const isSignedIn = Boolean(user);
  const destination = '/feed';

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setError('');
    if (k === 'email' && v.trim().toLowerCase() !== form.email.trim().toLowerCase()) {
      setVerificationSent(false);
      setEmailVerified(false);
      setVerificationCode('');
      setVerificationMessage('Enter your email and request a verification code.');
      setResendTimer(0);
    }
  };

  useEffect(() => {
    if (!resendTimer) return undefined;
    const timer = setInterval(() => setResendTimer(count => Math.max(0, count - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const clearForm = () => setForm({ name: '', email: '', password: '', confirm: '', company: '', jobTitle: '' });

  const requestVerificationCode = async () => {
    if (!form.email.trim()) {
      setVerificationMessage('Please enter your email first.');
      return;
    }
    setVerificationLoading(true);
    setEmailVerified(false);
    setError('');
    try {
      const response = await api.post('/auth/request-email-code', { email: form.email, purpose: 'register' });
      setVerificationSent(true);
      setVerificationMessage(response.message || 'Verification code sent.');
      setResendTimer(60);
    } catch (err) {
      setVerificationMessage(err.message || 'Unable to send code.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const confirmVerificationCode = async () => {
    if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
      setError('Enter the 6-digit verification code.');
      return;
    }
    setVerificationLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/verify-email-code', { email: form.email, purpose: 'register', code: verificationCode.trim() });
      setEmailVerified(true);
      setVerificationMessage(response.message || 'Email verified successfully.');
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (isSignedIn) {
      setError('Sign out first if you want to log in as a different person.');
      return;
    }

    if (mode === 'register') {
      if (!verificationSent) {
        setError('Please request a verification code for your email first.');
        return;
      }
      if (!emailVerified) {
        setError('Please verify your email with the code sent to you.');
        return;
      }
      if (form.password !== form.confirm) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const u = await login(form.email, form.password, role);
        router.replace('/feed');
      } else {
        if (form.password !== form.confirm) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        const u = await register({ name: form.name, email: form.email, password: form.password, role, company: form.company, jobTitle: form.jobTitle });
        router.replace('/feed');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = {
    employer: [
      { email: 'ceo@globalcorp.com', label: 'Chief Executive Officer' },
      { email: 'hr@globalcorp.com', label: 'HR Director' },
    ],
    applicant: [
      { email: 'jordan@email.com', label: 'Senior ML Engineer applicant' },
      { email: 'priya@email.com', label: 'Product Designer applicant' },
    ],
  };

  return (
    <div className="login-page">
      <div className="login-panel">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div className="nav-brand-mark" style={{ background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.12)' }}>H</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: '#fff', letterSpacing: '-.03em' }}>Hirely</div>
          </div>
          <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.58)', lineHeight: 1.7, maxWidth: 280, marginBottom: 48 }}>
            Executive-grade AI recruitment platform built for organisations that demand precision in every hire.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              { n: '01', t: 'AI-Powered Screening', d: 'Evaluate every candidate against your exact criteria with complete transparency.' },
              { n: '02', t: 'Full Reasoning Chain', d: 'Every verdict includes a step-by-step AI evaluation your board can trust.' },
              { n: '03', t: 'Role-Based Access', d: 'Separate employer and applicant portals with appropriate data controls.' },
            ].map(f => (
              <div key={f.n} style={{ display: 'flex', gap: 14 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'rgba(255,255,255,.3)', flexShrink: 0, marginTop: 2 }}>{f.n}</div>
                <div>
                  <div style={{ fontSize: '.84rem', fontWeight: 600, color: '#fff', marginBottom: 3 }}>{f.t}</div>
                  <div style={{ fontSize: '.76rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.55 }}>{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)' }}>Copyright {new Date().getFullYear()} Hirely. All rights reserved.</div>
      </div>

      <div className="login-form-area">
        <div className="login-card">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}><ThemeToggle /></div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 700, marginBottom: 4 }}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </div>
            <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
              {mode === 'login' ? 'Access your recruitment dashboard' : 'Join Hirely today'}
            </div>
          </div>

          {authLoading ? (
            <div className="alert alert-info" style={{ marginBottom: 18 }}>
              <span>i</span>
              Checking your current session...
            </div>
          ) : isSignedIn ? (
            <div className="alert alert-info" style={{ marginBottom: 18, display: 'block' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Signed in as {user.name || user.email} ({user.role})</div>
              <div style={{ color: 'var(--text2)', marginBottom: 12 }}>
                You can come back to this page any time, but you need to sign out before logging in as another person.
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-blue" onClick={() => router.replace(destination)}>Continue to dashboard</button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    logout();
                    clearForm();
                    setError('');
                    window.location.replace('/login');
                  }}
                >
                  Sign out to switch account
                </button>
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 8, padding: 3, gap: 3, marginBottom: 22, border: '1px solid var(--border)' }}>
            {['login', 'register'].map(m => (
              <button type="button" key={m} className={`role-tab ${mode === m ? 'active' : ''}`} onClick={() => { setMode(m); setError(''); }}>
                {m === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          <div className="form-group">
            <div className="form-label">Account type</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { key: 'employer', title: 'Organisation', sub: 'Post jobs & screen candidates' },
                { key: 'applicant', title: 'Candidate', sub: 'Apply & track applications' },
              ].map(r => (
                <div
                  key={r.key}
                  onClick={() => !isSignedIn && setRole(r.key)}
                  style={{
                    padding: '12px',
                    borderRadius: 8,
                    cursor: isSignedIn ? 'not-allowed' : 'pointer',
                    transition: 'all .15s',
                    border: `1.5px solid ${role === r.key ? 'var(--primary2)' : 'var(--border)'}`,
                    background: role === r.key ? 'var(--primary-l)' : 'var(--surface)',
                    opacity: isSignedIn ? 0.72 : 1,
                  }}
                >
                  <div style={{ fontSize: '.8rem', fontWeight: 700, color: role === r.key ? 'var(--primary2)' : 'var(--text)', marginBottom: 2 }}>{r.title}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{r.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">Full name</label>
                  <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" disabled={isSignedIn} />
                </div>
                {role === 'employer' && (
                  <div className="grid-2" style={{ marginBottom: 16 }}>
                    <div>
                      <label className="form-label">Organisation</label>
                      <input className="input" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Company name" disabled={isSignedIn} />
                    </div>
                    <div>
                      <label className="form-label">Your title</label>
                      <input className="input" value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} placeholder="e.g. HR Director" disabled={isSignedIn} />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@email.com" disabled={isSignedIn} />
              {mode === 'register' && !isSignedIn ? (
                <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={requestVerificationCode}
                    disabled={verificationLoading || !form.email.trim() || resendTimer > 0}
                  >
                    {verificationLoading ? 'Sending...' : resendTimer > 0 ? `Resend in ${resendTimer}s` : verificationSent ? 'Resend code' : 'Send code'}
                  </button>
                  {emailVerified && <span style={{ color: '#4aa96c', fontWeight: 600 }}>Email verified</span>}
                </div>
              ) : null}
              <div style={{ marginTop: 8, fontSize: '.78rem', color: emailVerified ? '#4aa96c' : '#999' }}>
                {verificationMessage}
              </div>
            </div>
            {mode === 'register' && verificationSent && !emailVerified && !isSignedIn ? (
              <div className="form-group">
                <label className="form-label">Verification code</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    className="input"
                    type="text"
                    inputMode="numeric"
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                    placeholder="6-digit code"
                    maxLength={6}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={confirmVerificationCode}
                    disabled={verificationLoading || verificationCode.trim().length !== 6}
                  >
                    {verificationLoading ? 'Checking...' : 'Verify'}
                  </button>
                </div>
              </div>
            ) : null}
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="input" type="password" required value={form.password} onChange={e => set('password', e.target.value)} placeholder="Minimum 6 characters" disabled={isSignedIn} />
            </div>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Confirm password</label>
                <input className="input" type="password" required value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="Re-enter your password" disabled={isSignedIn} />
              </div>
            )}

            {error && <div className="alert alert-error" style={{ marginBottom: 14 }}><span>!</span>{error}</div>}

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading || isSignedIn || (mode === 'register' && !emailVerified)} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? <span className="spinner" /> : null}
              {isSignedIn ? 'Sign out to change account' : mode === 'login' ? `Sign in as ${role === 'employer' ? 'Organisation' : 'Candidate'}` : 'Create account'}
            </button>
          </form>

          {mode === 'login' && !isSignedIn && (
            <div style={{ marginTop: 20, padding: 14, background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                Demo accounts - password: <code style={{ fontFamily: 'monospace' }}>demo1234</code>
              </div>
              {demoAccounts[role].map(a => (
                <div key={a.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <div>
                    <div style={{ fontSize: '.78rem', fontWeight: 500, color: 'var(--text)' }}>{a.email}</div>
                    <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>{a.label}</div>
                  </div>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => set('email', a.email)}>Use</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
            </span>
            <button type="button" className="btn btn-ghost" style={{ fontSize: '.78rem', padding: '2px 6px', display: 'inline' }} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
