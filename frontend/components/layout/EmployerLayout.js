'use client';
import { useAuth } from '../../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ThemeToggle, Avatar, ToastProvider } from '../ui';
import Link from 'next/link';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: <svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg> },
  { href: '/jobs', label: 'Job Listings', icon: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M14 5H2a1 1 0 00-1 1v7a1 1 0 001 1h12a1 1 0 001-1V6a1 1 0 00-1-1zm-1 7H3V7h10v5zM5 5V3a1 1 0 011-1h4a1 1 0 011 1v2H9V4H7v1H5z" /></svg> },
  { href: '/screener', label: 'AI Screener', icon: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12.5a5.5 5.5 0 110-11 5.5 5.5 0 010 11zm0-9a.75.75 0 01.75.75v3.5l2.1 1.2a.75.75 0 01-.75 1.3l-2.5-1.44A.75.75 0 017.25 9V5.25A.75.75 0 018 4.5z" /></svg> },
  { href: '/results', label: 'Candidates', icon: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3z" /></svg> },
  { href: '/analytics', label: 'Analytics', icon: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 11l3-4 3 2 4-6 3 3v5H1z" /></svg> },
  { href: '/settings', label: 'Settings', icon: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 10a2 2 0 100-4 2 2 0 000 4zm5.6-1.5a5.6 5.6 0 00.1-.5l1.1-.9a.3.3 0 000-.4l-1-1.7a.3.3 0 00-.4-.1l-1.3.5a5 5 0 00-.9-.5l-.2-1.4A.3.3 0 0010.5 3h-2a.3.3 0 00-.3.25l-.2 1.4a5 5 0 00-.9.5L5.8 4.6a.3.3 0 00-.4.1l-1 1.7a.3.3 0 000 .4l1.1.9a5.6 5.6 0 000 1l-1.1.9a.3.3 0 000 .4l1 1.7c.1.1.3.2.4.1l1.3-.5c.3.2.6.4.9.5l.2 1.4c0 .15.14.25.3.25h2c.16 0 .3-.1.3-.25l.2-1.4a5 5 0 00.9-.5l1.3.5c.1.1.3 0 .4-.1l1-1.7a.3.3 0 000-.4l-1.1-.9z" /></svg> },
];

export default function EmployerLayout({ children }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user?.role !== 'employer') router.replace('/applicant/dashboard');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner spinner-dark" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  return (
    <ToastProvider>
      <nav className="nav">
        <Link href="/dashboard" className="nav-brand" style={{ textDecoration: 'none' }}>
          <div className="nav-brand-mark">H</div>
          Hirely
        </Link>
        <div className="nav-links">
          {NAV.slice(0, 5).map(n => (
            <Link key={n.href} href={n.href} className={`nav-link ${pathname.startsWith(n.href) ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
              {n.label}
            </Link>
          ))}
        </div>
        <div className="nav-right">
          <ThemeToggle />
          <button type="button" className="nav-user" onClick={handleLogout} title="Sign out" style={{ background: 'transparent' }}>
            <Avatar name={user.name} size={24} />
            <span style={{ fontSize: '.78rem', fontWeight: 500, color: 'var(--text2)' }}>{user.name}</span>
            <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>Sign out</span>
          </button>
        </div>
      </nav>
      <div className="layout">
        <aside className="sidebar">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className={`s-item ${pathname.startsWith(n.href) ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
              <svg className="s-icon" viewBox="0 0 16 16" fill="currentColor">{n.icon.props.children}</svg>
              {n.label}
            </Link>
          ))}
          <hr />
          <div style={{ padding: '12px 10px', background: 'var(--bg2)', borderRadius: 6, margin: '8px 4px' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Signed in as</div>
            <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text2)' }}>{user.name}</div>
            <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{user.company || user.email}</div>
          </div>
        </aside>
        <main className="main">{children}</main>
      </div>
    </ToastProvider>
  );
}
