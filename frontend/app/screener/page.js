'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlatformLayout from '../../components/layout/PlatformLayout';

export default function ScreenerPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/talent'), 1200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <PlatformLayout>
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: 80 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 10 }}>Screening now happens from the Talent Hub</div>
          <div style={{ fontSize: '1rem', color: 'var(--muted)', maxWidth: 620, margin: '0 auto 18px' }}>
            Applicants enter the platform themselves, appear in your in-app applicant list, and you screen them with one click from the Talent Hub instead of pasting their data manually.
          </div>
          <button className="btn btn-blue" onClick={() => router.replace('/talent')}>Open Talent Hub</button>
        </div>
      </div>
    </PlatformLayout>
  );
}
