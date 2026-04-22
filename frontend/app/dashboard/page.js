'use client';
import { useEffect, useState } from 'react';
import EmployerLayout from '../../components/layout/EmployerLayout';
import { ScoreRing, VerdictBadge, Avatar, HrBadge, Empty } from '../../components/ui';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

function AIDetailModal({ s, onClose }) {
  const [tab, setTab] = useState('scores');
  if (!s) return null;
  const col = s.overallScore >= 75 ? 'var(--green)' : s.overallScore >= 50 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <Avatar name={s.applicantName} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.05rem', fontWeight: 700 }}>{s.applicantName}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{s.role}{s.applicantEmail ? ' · ' + s.applicantEmail : ''}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ScoreRing score={s.overallScore} size={50} />
            <VerdictBadge verdict={s.verdict} />
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="tabs" style={{ padding: '0 24px', marginBottom: 0, flexShrink: 0 }}>
          {[['scores','Factor Scores'],['reasoning','AI Reasoning'],['strengths','Strengths & Concerns'],['interview','Interview Questions']].map(([k,l]) => (
            <div key={k} className={`tab ${tab===k?'active':''}`} onClick={() => setTab(k)}>{l}</div>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {tab === 'scores' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {(s.factorScores || []).map(f => {
                  const fc = f.score >= 75 ? 'var(--green)' : f.score >= 50 ? 'var(--amber)' : 'var(--red)';
                  return (
                    <div key={f.name} className="card-sm" style={{ padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{f.name}</div>
                        <div style={{ fontSize: '.68rem', color: 'var(--muted2)' }}>{f.weight}%</div>
                      </div>
                      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.4rem', fontWeight: 700, color: fc, marginBottom: 6 }}>{Math.round(f.score)}<span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--muted)' }}>/100</span></div>
                      <div className="progress" style={{ marginBottom: 6 }}><div className="progress-fill" style={{ width: `${f.score}%`, background: fc }} /></div>
                      {f.note && <div style={{ fontSize: '.75rem', color: 'var(--text2)', lineHeight: 1.5 }}>{f.note}</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '13px 16px', background: 'var(--bg2)', borderRadius: 6, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '.8rem', fontWeight: 600 }}>Overall weighted score</div>
                <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.4rem', fontWeight: 700, color: col }}>{Math.round(s.overallScore)}%</div>
              </div>
              {s.summary && <div style={{ marginTop: 14, padding: '13px 16px', borderLeft: '3px solid var(--primary2)', background: 'var(--primary-l)', borderRadius: '0 6px 6px 0' }}><div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--primary2)', marginBottom: 4 }}>Executive Summary</div><div style={{ fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.65, fontStyle: 'italic' }}>{s.summary}</div></div>}
            </div>
          )}
          {tab === 'reasoning' && (
            <div>
              <div style={{ padding: '10px 14px', background: 'var(--primary-l)', border: '1px solid var(--primary-m)', borderRadius: 6, marginBottom: 16, fontSize: '.78rem', color: 'var(--primary2)', fontWeight: 500 }}>
                The following evaluation chain documents how the AI assessed this candidate, step by step.
              </div>
              {(s.aiReasoning || []).map((step, i) => (
                <div key={i} className="reasoning-step">
                  <div className="r-num">{i + 1}</div>
                  <div className="r-txt">{step}</div>
                </div>
              ))}
            </div>
          )}
          {tab === 'strengths' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Key Strengths</div>
                {(s.strengths || []).map((str, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--green)', fontSize: '.8rem', marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.5 }}>{str}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Areas of Concern</div>
                {(s.concerns || []).map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--amber)', fontSize: '.8rem', marginTop: 1 }}>△</span>
                    <span style={{ fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.5 }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'interview' && (
            <div>
              <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: 14 }}>AI-generated interview questions based on identified gaps and areas requiring validation.</div>
              {(s.interviewQuestions || []).map((q, i) => (
                <div key={i} style={{ padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 8 }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Question {i + 1}</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text)', lineHeight: 1.6 }}>{q}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/jobs/dashboard-stats').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <EmployerLayout><div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ width: 28, height: 28 }} /></div></EmployerLayout>;

  const stats = data?.stats || {};
  const recent = data?.recentScreenings || [];
  const AVATARS = ['#1e3a5f','#15803d','#0369a1','#b45309','#7c2d12'];

  return (
    <EmployerLayout>
      {selected && <AIDetailModal s={selected} onClose={() => setSelected(null)} />}
      <div className="page-header">
        <div className="page-eyebrow">Executive Overview</div>
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <div className="page-sub">Your recruitment pipeline at a glance. Select any candidate to view the full AI evaluation.</div>
      </div>

      <div className="kpi-grid">
        {[
          { label: 'Total Screened', val: stats.totalScreenings ?? 0, sub: 'All AI evaluations', col: 'var(--primary2)' },
          { label: 'Advancing', val: stats.advance ?? 0, sub: `${stats.advanceRate ?? 0}% advance rate`, col: 'var(--green)' },
          { label: 'Under Review', val: stats.review ?? 0, sub: 'Pending HR decision', col: 'var(--amber)' },
          { label: 'Active Roles', val: stats.activeJobs ?? 0, sub: `of ${stats.totalJobs ?? 0} total positions`, col: 'var(--sky)' },
          { label: 'Avg AI Score', val: `${stats.avgScore ?? 0}%`, sub: 'Across all candidates', col: 'var(--primary)' },
        ].map((k, i) => (
          <div key={i} className="kpi">
            <div className="kpi-val" style={{ color: k.col }}>{k.val}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-sub" style={{ color: 'var(--muted)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
        {/* Recent screenings table */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1rem' }}>Recent Evaluations</div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 2 }}>Click any row to view the full AI reasoning chain</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => router.push('/results')}>View all</button>
          </div>
          {recent.length === 0 ? (
            <div className="card-body">
              <Empty icon="◎" title="No evaluations yet" sub="Use the AI Screener to evaluate your first candidate" action={<button className="btn btn-blue" onClick={() => router.push('/screener')}>Open Screener</button>} />
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Candidate</th><th>Role</th><th>Score</th><th>Verdict</th><th>HR Status</th><th>Date</th></tr></thead>
                <tbody>
                  {recent.map((s, i) => (
                    <tr key={s._id} onClick={() => setSelected(s)}>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={s.applicantName} size={28} color={AVATARS[i % AVATARS.length]} /><div><div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.applicantName}</div><div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{s.applicantEmail}</div></div></div></td>
                      <td style={{ color: 'var(--text2)' }}>{s.role}</td>
                      <td><ScoreRing score={s.overallScore} size={36} /></td>
                      <td><VerdictBadge verdict={s.verdict} /></td>
                      <td><HrBadge status={s.hrStatus} /></td>
                      <td style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{new Date(s.screenedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pipeline breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1rem' }}>Pipeline Breakdown</div></div>
            <div className="card-body" style={{ paddingTop: 16 }}>
              {[
                { label: 'Advance', val: stats.advance ?? 0, total: stats.totalScreenings || 1, col: 'var(--green)' },
                { label: 'Review', val: stats.review ?? 0, total: stats.totalScreenings || 1, col: 'var(--amber)' },
                { label: 'Decline', val: stats.decline ?? 0, total: stats.totalScreenings || 1, col: 'var(--red)' },
              ].map(b => (
                <div key={b.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', fontWeight: 600, marginBottom: 5 }}>
                    <span style={{ color: 'var(--text2)' }}>{b.label}</span>
                    <span style={{ color: b.col }}>{b.val} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>({Math.round(b.val / b.total * 100)}%)</span></span>
                  </div>
                  <div className="progress"><div className="progress-fill" style={{ width: `${(b.val / b.total) * 100}%`, background: b.col }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1rem' }}>Quick Actions</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Screen a new candidate', href: '/screener', cls: 'btn-blue' },
                { label: 'Post a new position', href: '/jobs', cls: 'btn-outline' },
                { label: 'View all candidates', href: '/results', cls: 'btn-outline' },
                { label: 'Analytics & reports', href: '/analytics', cls: 'btn-ghost' },
              ].map(a => (
                <button key={a.label} className={`btn ${a.cls}`} style={{ justifyContent: 'flex-start' }} onClick={() => router.push(a.href)}>{a.label} →</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </EmployerLayout>
  );
}
