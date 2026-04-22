'use client';
import { useEffect, useState } from 'react';
import EmployerLayout from '../../components/layout/EmployerLayout';
import { scoreColor } from '../../components/ui';
import api from '../../lib/api';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/screenings/analytics').then(d => { setData(d.analytics); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <EmployerLayout><div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ width: 28, height: 28 }} /></div></EmployerLayout>;

  const a = data || { total: 0, advance: 0, review: 0, decline: 0, avg: 0, advanceRate: 0, dist: [], factorAverages: [] };
  const maxDist = Math.max(...(a.dist || []).map(d => d.count), 1);
  const BAR_COLS = ['#fca5a5','#fdba74','#fcd34d','#86efac','#4ade80'];

  const DonutChart = ({ adv, rev, dec, total }) => {
    if (!total) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No data</div>;
    const r = 54, cx = 70, cy = 70, circ = 2 * Math.PI * r;
    let off = 0;
    const segs = [{ v: adv, col: 'var(--green)' }, { v: rev, col: 'var(--amber)' }, { v: dec, col: 'var(--red)' }];
    return (
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg2)" strokeWidth={20} />
        {segs.map((s, i) => {
          const dash = (s.v / total) * circ;
          const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.col} strokeWidth={20} strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-off + circ * 0.25} />;
          off += dash; return el;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="Playfair Display,serif" fontSize={20} fontWeight={700} fill="var(--text)">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={10} fill="var(--muted)" fontWeight={600}>TOTAL</text>
      </svg>
    );
  };

  return (
    <EmployerLayout>
      <div className="page-header">
        <div className="page-eyebrow">Reporting</div>
        <h1 className="page-title">Recruitment Analytics</h1>
        <div className="page-sub">Data-driven insights into your hiring pipeline, scoring patterns, and evaluation performance.</div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {[
          { l: 'Total Evaluated', v: a.total, c: 'var(--primary2)' },
          { l: 'Advance Rate', v: `${a.advanceRate}%`, c: 'var(--green)' },
          { l: 'Average Score', v: `${a.avg}%`, c: 'var(--sky)' },
          { l: 'High Scorers (75+)', v: a.dist?.slice(3).reduce((s, d) => s + d.count, 0) || 0, c: 'var(--primary)' },
        ].map((k, i) => (
          <div key={i} className="kpi"><div className="kpi-val" style={{ color: k.c }}>{k.v}</div><div className="kpi-label">{k.l}</div></div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1rem' }}>Score Distribution</div></div>
          <div className="card-body">
            <div className="bar-chart">
              {(a.dist || []).map((d, i) => (
                <div key={d.range} className="bar-col">
                  <div className="bar-val">{d.count}</div>
                  <div className="bar-fill" style={{ height: `${(d.count / maxDist) * 100}%`, background: BAR_COLS[i] }} />
                  <div className="bar-lbl">{d.range}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1rem' }}>Verdict Distribution</div></div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <DonutChart adv={a.advance} rev={a.review} dec={a.decline} total={a.total} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['Advance', a.advance, 'var(--green)'], ['Under Review', a.review, 'var(--amber)'], ['Decline', a.decline, 'var(--red)']].map(([l, v, c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                  <div>
                    <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text2)' }}>{l}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{v} candidate{v !== 1 ? 's' : ''} ({a.total ? Math.round(v / a.total * 100) : 0}%)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header"><div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1rem' }}>Average Score by Criterion</div></div>
          <div className="card-body">
            {(a.factorAverages || []).length === 0 && <div style={{ color: 'var(--muted)', fontSize: '.8rem' }}>Evaluate candidates to see criterion averages.</div>}
            {(a.factorAverages || []).map(f => {
              const col = scoreColor(f.avg);
              return (
                <div key={f.name} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', fontWeight: 600, marginBottom: 5 }}>
                    <span style={{ color: 'var(--text2)' }}>{f.name}</span>
                    <span style={{ color: col }}>{f.avg}%</span>
                  </div>
                  <div className="progress"><div className="progress-fill" style={{ width: `${f.avg}%`, background: col }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1rem' }}>Insights & Observations</div></div>
          <div className="card-body">
            {a.total === 0 ? <div style={{ color: 'var(--muted)', fontSize: '.8rem' }}>No data yet. Begin screening candidates to generate insights.</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Advance rate', val: `${a.advanceRate}%`, note: a.advanceRate >= 30 ? 'Above average — consider tightening criteria' : 'Selective screening in effect', good: a.advanceRate < 30 },
                  { label: 'Average candidate score', val: `${a.avg}%`, note: a.avg >= 65 ? 'High-quality applicant pool' : 'Room to improve sourcing channels', good: a.avg >= 65 },
                  { label: 'Total evaluations', val: a.total, note: a.total >= 10 ? 'Sufficient data for trend analysis' : 'Evaluate more candidates for reliable analytics', good: a.total >= 10 },
                ].map(ins => (
                  <div key={ins.label} style={{ padding: '12px 14px', borderLeft: `3px solid ${ins.good ? 'var(--green)' : 'var(--amber)'}`, background: ins.good ? 'var(--green-bg)' : 'var(--amber-bg)', borderRadius: '0 6px 6px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text2)' }}>{ins.label}</span>
                      <span style={{ fontFamily: 'Playfair Display,serif', fontSize: '1rem', fontWeight: 700, color: ins.good ? 'var(--green)' : 'var(--amber)' }}>{ins.val}</span>
                    </div>
                    <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{ins.note}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </EmployerLayout>
  );
}
