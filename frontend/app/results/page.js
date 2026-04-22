'use client';
// ─────────────────────────────────────────────────────────────
// RESULTS PAGE
// ─────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import EmployerLayout from '../../components/layout/EmployerLayout';
import { ScoreRing, VerdictBadge, Avatar, HrBadge, Modal, Confirm, Empty, scoreColor, useToast } from '../../components/ui';
import api from '../../lib/api';

function DetailDrawer({ s, onClose, onStatusUpdate }) {
  const [tab, setTab] = useState('scores');
  const [hrStatus, setHrStatus] = useState(s?.hrStatus || 'pending');
  const [hrNotes, setHrNotes] = useState(s?.hrNotes || '');
  const [saving, setSaving] = useState(false);
  const { add: toast } = useToast();

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.put(`/screenings/${s._id}/status`, { hrStatus, hrNotes });
      toast('HR status updated.', 'success');
      onStatusUpdate(updated.screening);
    } catch (err) { toast(err.message, 'error'); }
    setSaving(false);
  };

  if (!s) return null;
  const AVATARS = ['#1e3a5f','#15803d','#0369a1','#b45309'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: '100%', maxWidth: 720, background: 'var(--surface)', borderLeft: '1px solid var(--border2)', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', animation: 'slideup .25s ease' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <Avatar name={s.applicantName} size={44} color={AVATARS[0]} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.1rem', fontWeight: 700 }}>{s.applicantName}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{s.role}{s.applicantEmail ? ' · ' + s.applicantEmail : ''} · Evaluated {new Date(s.screenedAt).toLocaleDateString()}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ScoreRing score={s.overallScore} size={52} />
            <VerdictBadge verdict={s.verdict} />
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="tabs" style={{ padding: '0 24px', margin: '0', flexShrink: 0 }}>
          {[['scores','Scores'],['reasoning','AI Reasoning'],['detail','Strengths & Concerns'],['interview','Interview Qs'],['hr','HR Actions']].map(([k,l]) => (
            <div key={k} className={`tab ${tab===k?'active':''}`} onClick={() => setTab(k)}>{l}</div>
          ))}
        </div>

        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
          {tab === 'scores' && (
            <div>
              {s.summary && <div style={{ padding: '12px 16px', borderLeft: '3px solid var(--primary2)', background: 'var(--primary-l)', borderRadius: '0 6px 6px 0', marginBottom: 18 }}><div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--primary2)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Executive Summary</div><div style={{ fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.7, fontStyle: 'italic' }}>{s.summary}</div></div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {(s.factorScores || []).map(f => {
                  const fc = scoreColor(f.score);
                  return (
                    <div key={f.name} className="card-sm" style={{ padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{f.name}</div>
                        <div style={{ fontSize: '.68rem', color: 'var(--muted2)' }}>{f.weight}% weight</div>
                      </div>
                      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.4rem', fontWeight: 700, color: fc, marginBottom: 6 }}>{Math.round(f.score)}<span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--muted)' }}>/100</span></div>
                      <div className="progress" style={{ marginBottom: 6 }}><div className="progress-fill" style={{ width: `${f.score}%`, background: fc }} /></div>
                      {f.note && <div style={{ fontSize: '.75rem', color: 'var(--text2)', lineHeight: 1.5 }}>{f.note}</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--bg2)', borderRadius: 6, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '.82rem', fontWeight: 600 }}>Weighted overall score</span>
                <span style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.5rem', fontWeight: 700, color: scoreColor(s.overallScore) }}>{Math.round(s.overallScore)}%</span>
              </div>
            </div>
          )}

          {tab === 'reasoning' && (
            <div>
              <div style={{ padding: '10px 14px', background: 'var(--primary-l)', border: '1px solid var(--primary-m)', borderRadius: 6, marginBottom: 16, fontSize: '.78rem', color: 'var(--primary2)', fontWeight: 500 }}>
                Complete evaluation chain — each step documents the AI's assessment process for full auditability and accountability.
              </div>
              {(s.aiReasoning || []).map((step, i) => (
                <div key={i} className="reasoning-step">
                  <div className="r-num">{i + 1}</div>
                  <div className="r-txt">{step}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'detail' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Key Strengths</div>
                {(s.strengths || []).map((str, i) => <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.5 }}><span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span>{str}</div>)}
              </div>
              <div>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Areas of Concern</div>
                {(s.concerns || []).map((c, i) => <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.5 }}><span style={{ color: 'var(--amber)', flexShrink: 0 }}>△</span>{c}</div>)}
              </div>
            </div>
          )}

          {tab === 'interview' && (
            <div>
              <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: 16 }}>AI-generated interview questions targeted at validating this candidate's specific profile and addressing identified gaps.</div>
              {(s.interviewQuestions || []).map((q, i) => (
                <div key={i} style={{ padding: '13px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 10 }}>
                  <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5 }}>Question {i + 1}</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text)', lineHeight: 1.65 }}>{q}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'hr' && (
            <div>
              <div className="form-group">
                <label className="form-label">HR Pipeline Status</label>
                <select className="input" value={hrStatus} onChange={e => setHrStatus(e.target.value)}>
                  {['pending','shortlisted','interviewed','offered','rejected'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Internal HR Notes</label>
                <textarea className="input" style={{ minHeight: 120 }} value={hrNotes} onChange={e => setHrNotes(e.target.value)} placeholder="Add internal notes, observations, or next steps for this candidate…" />
                <div className="form-hint">These notes are visible only to your team and are not shared with the candidate.</div>
              </div>
              <button className="btn btn-blue" onClick={save} disabled={saving}>{saving ? <span className="spinner"/> : null}Save HR record</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { add: toast } = useToast();
  const router = useRouter();
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = filter !== 'all' ? `?verdict=${filter}` : '';
    api.get(`/screenings${params}`).then(d => { setScreenings(d.screenings); setLoading(false); }).catch(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const counts = { all: screenings.length, Advance: screenings.filter(s => s.verdict === 'Advance').length, Review: screenings.filter(s => s.verdict === 'Review').length, Decline: screenings.filter(s => s.verdict === 'Decline').length };

  const exportCSV = () => {
    const rows = [['Name','Email','Role','Score','Verdict','HR Status','Date']];
    screenings.forEach(s => rows.push([s.applicantName, s.applicantEmail, s.role, s.overallScore, s.verdict, s.hrStatus, new Date(s.screenedAt).toLocaleDateString()]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = `hirely_candidates_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    toast('Export downloaded.', 'success');
  };

  const doDelete = async () => {
    try { await api.delete(`/screenings/${deleteTarget._id}`); toast('Record deleted.', 'success'); setDeleteTarget(null); load(); }
    catch (err) { toast(err.message, 'error'); }
  };

  const AVATARS = ['#1e3a5f','#15803d','#0369a1','#b45309','#7c2d12'];

  return (
    <EmployerLayout>
      <Confirm open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={doDelete} title="Delete evaluation record" message={`Remove the evaluation for "${deleteTarget?.applicantName}"? This cannot be undone.`} />
      {selected && <DetailDrawer s={selected} onClose={() => setSelected(null)} onStatusUpdate={updated => { setScreenings(prev => prev.map(s => s._id === updated._id ? updated : s)); setSelected(updated); }} />}

      <div className="page-header">
        <div className="page-eyebrow">Talent Pipeline</div>
        <h1 className="page-title">Screened Candidates</h1>
        <div className="page-sub">All evaluated candidates ranked by AI score. Select any row to view detailed scoring, reasoning chain, and HR tools.</div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
        {[['Total',counts.all,'var(--primary2)'],['Advance',counts.Advance,'var(--green)'],['Review',counts.Review,'var(--amber)'],['Decline',counts.Decline,'var(--red)']].map(([l,v,c]) => (
          <div key={l} className="kpi"><div className="kpi-val" style={{ color: c }}>{v}</div><div className="kpi-label">{l}</div></div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        {['all','Advance','Review','Decline'].map(f => (
          <button key={f} className={`btn ${filter===f?'btn-blue':'btn-outline'} btn-sm`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All candidates' : f} {filter===f&&`(${counts[f]||counts.all})`}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>↓ Export CSV</button>
          <button className="btn btn-blue btn-sm" onClick={() => router.push('/screener')}>+ Screen candidate</button>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ width: 24, height: 24, margin: '0 auto' }} /></div> :
        screenings.length === 0 ?
        <div className="card"><div className="card-body"><Empty icon="◎" title="No candidates yet" sub="Use the AI Screener to evaluate your first candidate" action={<button className="btn btn-blue" onClick={() => router.push('/screener')}>Open Screener</button>} /></div></div> :
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th style={{width:28}}>#</th><th>Candidate</th><th>Role</th><th>Score</th><th>Verdict</th><th>HR Status</th><th>Screened</th><th style={{width:90}}>Actions</th></tr></thead>
              <tbody>
                {screenings.map((s, i) => (
                  <tr key={s._id} onClick={() => setSelected(s)}>
                    <td style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '.78rem' }}>{i + 1}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={s.applicantName} size={30} color={AVATARS[i % AVATARS.length]} /><div><div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.applicantName}</div><div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{s.applicantEmail}</div></div></div></td>
                    <td style={{ color: 'var(--text2)', maxWidth: 180 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.role}</div></td>
                    <td><ScoreRing score={s.overallScore} size={36} /></td>
                    <td><VerdictBadge verdict={s.verdict} /></td>
                    <td><HrBadge status={s.hrStatus} /></td>
                    <td style={{ color: 'var(--muted)', whiteSpace: 'nowrap', fontSize: '.78rem' }}>{new Date(s.screenedAt).toLocaleDateString()}</td>
                    <td onClick={e => e.stopPropagation()}><button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(s)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      }
    </EmployerLayout>
  );
}
