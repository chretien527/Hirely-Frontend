'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import EmployerLayout from '../../components/layout/EmployerLayout';
import { useToast } from '../../components/ui';
import api from '../../lib/api';
import { extractResumeText } from '../../lib/resumeUpload';

const DEFAULT_FACTORS = [
  { id: 1, name: 'Technical Skills', weight: 30, on: true },
  { id: 2, name: 'Relevant Experience', weight: 25, on: true },
  { id: 3, name: 'Education & Credentials', weight: 15, on: true },
  { id: 4, name: 'Communication Clarity', weight: 10, on: true },
  { id: 5, name: 'Leadership & Initiative', weight: 10, on: true },
  { id: 6, name: 'Cultural Fit', weight: 10, on: true },
];

export default function ScreenerPage() {
  const { add: toast } = useToast();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [factors, setFactors] = useState(DEFAULT_FACTORS);
  const [form, setForm] = useState({ name: '', email: '', role: '', jobId: '', resume: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [newFactor, setNewFactor] = useState({ name: '', weight: 10 });
  const [showAddFactor, setShowAddFactor] = useState(false);
  const [resumeFileName, setResumeFileName] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/jobs').then(d => setJobs(d.jobs.filter(j => j.status === 'active'))).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const activeFactors = factors.filter(f => f.on);
  const totalWeight = activeFactors.reduce((sum, factor) => sum + factor.weight, 0);

  const toggleFactor = (id) => setFactors(items => items.map(f => f.id === id ? { ...f, on: !f.on } : f));
  const updateWeight = (id, w) => setFactors(items => items.map(f => f.id === id ? { ...f, weight: Math.max(1, Math.min(50, Number(w))) } : f));
  const addFactor = () => {
    if (!newFactor.name.trim()) return;
    setFactors(items => [...items, { id: Date.now(), name: newFactor.name.trim(), weight: newFactor.weight, on: true }]);
    setNewFactor({ name: '', weight: 10 });
    setShowAddFactor(false);
  };
  const removeFactor = (id) => setFactors(items => items.filter(f => f.id !== id));

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    try {
      const text = await extractResumeText(file);
      set('resume', text);
      setResumeFileName(file.name);
      toast(`Attached ${file.name}.`, 'success');
    } catch (err) {
      toast(err.message || 'Could not read that file.', 'error');
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  const screen = async () => {
    if (!form.name || !form.resume) {
      toast('Candidate name and resume are required.', 'error');
      return;
    }
    if (!form.role && !form.jobId) {
      toast('Please specify the role or select a position.', 'error');
      return;
    }
    if (activeFactors.length === 0) {
      toast('At least one screening factor must be active.', 'error');
      return;
    }

    setLoading(true);
    setStatus('Submitting to AI evaluation engine...');

    try {
      const role = form.jobId ? (jobs.find(j => j._id === form.jobId)?.title || form.role) : form.role;
      const payload = {
        applicantName: form.name,
        applicantEmail: form.email,
        role,
        resumeText: form.resume,
        factors: activeFactors.map(f => ({ name: f.name, weight: f.weight })),
        jobId: form.jobId || undefined,
      };

      setStatus('AI is conducting evaluation - this may take 20-30 seconds...');
      await api.post('/screenings', payload);
      toast('Evaluation complete. Redirecting to results...', 'success');
      setForm({ name: '', email: '', role: '', jobId: '', resume: '' });
      setResumeFileName('');
      setTimeout(() => router.push('/results'), 1200);
    } catch (err) {
      toast(err.message || 'Evaluation failed. Please retry.', 'error');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EmployerLayout>
      <div className="page-header">
        <div className="page-eyebrow">Evaluation Engine</div>
        <h1 className="page-title">AI Candidate Screener</h1>
        <div className="page-sub">Configure your evaluation criteria, submit a candidate's CV, and receive a comprehensive AI-generated assessment with full reasoning documentation.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 22, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.95rem' }}>Evaluation Criteria</div>
              <div style={{ fontSize: '.72rem', color: totalWeight === 100 ? 'var(--green)' : 'var(--amber)', fontWeight: 600 }}>{totalWeight}% total</div>
            </div>
            <div className="card-body" style={{ paddingTop: 14 }}>
              {factors.map(f => (
                <div key={f.id} className={`factor-chip ${f.on ? 'on' : ''}`} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }} onClick={() => toggleFactor(f.id)}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: f.on ? 'var(--primary2)' : 'var(--muted2)', flexShrink: 0 }} />
                    <span style={{ fontSize: '.78rem', fontWeight: 500, color: f.on ? 'var(--text)' : 'var(--muted)', flex: 1 }}>{f.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {f.on && <input type="number" min="1" max="50" value={f.weight} onChange={e => updateWeight(f.id, e.target.value)} onClick={e => e.stopPropagation()} style={{ width: 44, padding: '3px 6px', fontSize: '.72rem', border: '1px solid var(--border2)', borderRadius: 4, background: 'var(--surface)', color: 'var(--text)', textAlign: 'center' }} />}
                    {!f.on && <span style={{ fontSize: '.72rem', color: 'var(--muted2)' }}>{f.weight}%</span>}
                    <button type="button" onClick={e => { e.stopPropagation(); removeFactor(f.id); }} style={{ background: 'none', border: 'none', color: 'var(--muted2)', cursor: 'pointer', fontSize: '.9rem', lineHeight: 1, padding: '0 2px' }}>x</button>
                  </div>
                </div>
              ))}

              {showAddFactor ? (
                <div style={{ marginTop: 10, padding: '12px', background: 'var(--bg2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <input className="input" placeholder="Factor name" value={newFactor.name} onChange={e => setNewFactor(f => ({ ...f, name: e.target.value }))} style={{ marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" className="input" placeholder="Weight %" value={newFactor.weight} onChange={e => setNewFactor(f => ({ ...f, weight: Number(e.target.value) }))} style={{ width: 80 }} />
                    <button type="button" className="btn btn-blue btn-sm" style={{ flex: 1 }} onClick={addFactor}>Add</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddFactor(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => setShowAddFactor(true)}>+ Add criterion</button>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Verdict Thresholds</div>
              {[['Advance', '75 - 100', 'var(--green)'], ['Review', '50 - 74', 'var(--amber)'], ['Decline', '0 - 49', 'var(--red)']].map(([verdict, range, color]) => (
                <div key={verdict} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '.78rem', fontWeight: 600, color }}>{verdict}</span>
                  <span style={{ fontSize: '.75rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Candidate Submission Form</div>
            <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 2 }}>All evaluations are stored and auditable. The AI receives only the information provided below.</div>
          </div>
          <div className="card-body">
            <div className="grid-2" style={{ marginBottom: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Candidate full name *</label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Jean-Pierre Nkurunziza" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email address</label>
                <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="candidate@example.com" />
              </div>
            </div>
            <div className="grid-2" style={{ marginBottom: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Open position</label>
                <select className="input" value={form.jobId} onChange={e => set('jobId', e.target.value)}>
                  <option value="">- Select from active jobs -</option>
                  {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Or type role manually</label>
                <input className="input" value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Chief Data Officer" disabled={!!form.jobId} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Curriculum Vitae / Resume *</label>
              <div className="upload-box">
                <div className="upload-copy">
                  <div className="upload-title">Attach a resume file</div>
                  <div className="upload-sub">Upload TXT, MD, RTF, CSV, or another plain-text document and we will place the extracted text into the CV field.</div>
                  {resumeFileName && <div className="upload-meta">Current file: {resumeFileName}</div>}
                </div>
                <div className="upload-actions">
                  <input ref={fileInputRef} type="file" className="hidden-file-input" accept=".txt,.md,.rtf,.csv,.json,text/*" onChange={handleResumeUpload} />
                  <button type="button" className="btn btn-outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingResume}>
                    {uploadingResume ? 'Uploading...' : 'Attach file'}
                  </button>
                </div>
              </div>
              <textarea className="input" style={{ minHeight: 260, fontFamily: 'var(--font-mono)', fontSize: '.78rem', lineHeight: 1.7 }} value={form.resume} onChange={e => set('resume', e.target.value)} placeholder={`Paste the candidate's full CV text here.\n\nInclude:\n- Work experience (company, title, dates, achievements)\n- Education and academic qualifications\n- Technical skills and certifications\n- Projects, publications, or notable accomplishments\n\nThe more detail provided, the more accurate the evaluation.`} />
              <div className="form-hint">The AI evaluates this text against your active criteria. You can paste it manually or attach a plain-text resume file above.</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: 'var(--bg2)', borderRadius: 6, border: '1px solid var(--border)', marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 2 }}>Evaluation scope</div>
                <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{activeFactors.length} active criteria - {totalWeight}% total weight - {totalWeight === 100 ? 'Balanced' : 'Target: 100%'}</div>
              </div>
              <button className="btn btn-primary btn-lg" onClick={screen} disabled={loading}>
                {loading ? <><span className="spinner" style={{ marginRight: 4 }} />Evaluating...</> : 'Run AI Evaluation'}
              </button>
            </div>

            {status && <div className="alert alert-info"><span>i</span>{status}</div>}
          </div>
        </div>
      </div>
    </EmployerLayout>
  );
}
