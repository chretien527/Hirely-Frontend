'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlatformLayout from '../../components/layout/PlatformLayout';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/talent'), 800);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <PlatformLayout>
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: 80 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 10 }}>The employer home has moved into the wider platform</div>
          <div style={{ fontSize: '1rem', color: 'var(--muted)', maxWidth: 620, margin: '0 auto 18px' }}>
            You now have a connected feed, network, messaging, and talent inbox. Redirecting you to the Talent Hub.
          </div>
          <button className="btn btn-blue" onClick={() => router.replace('/talent')}>Open Talent Hub</button>
        </div>
      </div>
    </PlatformLayout>
  );
}
