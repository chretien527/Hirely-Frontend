'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Avatar, ThemeToggle, ToastProvider } from '../ui';

const baseNav = [
  { href: '/feed', label: 'Feed' },
  { href: '/network', label: 'Network' },
  { href: '/messages', label: 'Messages' },
];

export default function PlatformLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner spinner-dark" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  const nav = [
    ...baseNav,
    ...(user.role === 'employer'
      ? [{ href: '/talent', label: 'Talent Hub' }, { href: '/jobs', label: 'Jobs' }]
      : [{ href: '/applicant/dashboard', label: 'Applications' }, { href: '/applicant/jobs', label: 'Jobs' }]),
    { href: '/settings', label: 'Profile' },
  ];

  const handleLogout = () => {
    logout();
    window.location.replace('/login');
  };

  return (
    <ToastProvider>
      <nav className="nav">
        <Link href="/feed" className="nav-brand" style={{ textDecoration: 'none' }}>
          <div className="nav-brand-mark">H</div>
          Hirely
        </Link>
        <div className="nav-links">
          {nav.map(item => (
            <Link key={item.href} href={item.href} className={`nav-link ${pathname.startsWith(item.href) ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="nav-right">
          <div className={`badge ${user.role === 'employer' ? 'badge-blue' : 'badge-green'}`}>{user.role === 'employer' ? 'Jobgiver' : 'Applicant'}</div>
          <ThemeToggle />
          <button type="button" className="nav-user" onClick={handleLogout} style={{ background: 'transparent' }}>
            <Avatar name={user.name} size={24} imageSrc={user.profileImage} />
            <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text2)' }}>{user.name}</span>
          </button>
        </div>
      </nav>
      <div style={{ paddingTop: 92, maxWidth: 1240, margin: '0 auto', paddingInline: 32, paddingBottom: 40 }}>
        {children}
      </div>
    </ToastProvider>
  );
}
