'use client';
import { useEffect, useState } from 'react';
import EmployerLayout from '../../components/layout/EmployerLayout';
import { Modal, Confirm, StatusDot, Empty, useToast } from '../../components/ui';
import api from '../../lib/api';

const EMPTY_FORM = { title: '', department: 'Engineering', location: 'Remote', type: 'Full-time', salary: '', description: '', requirements: '', skills: '' };
const DEPTS = ['Engineering','Product','Design','Marketing','Operations','Finance','Legal','Sales'];
const TYPES = ['Full-time','Part-time','Contract','Internship'];

export default function JobsPage() {
  const { add: toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetch = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/jobs?${params}`).then(d => { setJobs(d.jobs); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [search, statusFilter]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => { setEditJob(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (j) => { setEditJob(j); setForm({ title: j.title, department: j.department, location: j.location, type: j.type, salary: j.salary || '', description: j.description, requirements: j.requirements || '', skills: (j.skills || []).join(', ') }); setShowForm(true); };

  const save = async () => {
    if (!form.title || !form.description) { toast('Title and description are required.', 'error'); return; }
    setSaving(true);
    try {
      const payload = { ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) };
      if (editJob) { await api.put(`/jobs/${editJob._id}`, payload); toast('Position updated.'); }
      else { await api.post('/jobs', payload); toast('Position posted successfully.'); }
      setShowForm(false); fetch();
    } catch (err) { toast(err.message, 'error'); }
    setSaving(false);
  };

  const toggleStatus = async (j) => {
    const next = j.status === 'active' ? 'paused' : 'active';
    try { await api.put(`/jobs/${j._id}`, { status: next }); toast(`"${j.title}" ${next}.`); fetch(); }
    catch (err) { toast(err.message, 'error'); }
  };

  const doDelete = async () => {
    try { await api.delete(`/jobs/${deleteTarget._id}`); toast('Position removed.'); setDeleteTarget(null); fetch(); }
    catch (err) { toast(err.message, 'error'); }
  };

  return (
    <EmployerLayout>
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editJob ? 'Edit position' : 'Post new position'} subtitle="Complete all required fields before publishing" maxWidth={620}
        footer={<><button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-blue" onClick={save} disabled={saving}>{saving ? <span className="spinner"/> : null}{editJob ? 'Save changes' : 'Post position'}</button></>}>
        <div className="grid-2" style={{ marginBottom: 14 }}>
          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Job title *</label><input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Senior Software Engineer" /></div>
          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Department</label><select className="input" value={form.department} onChange={e => set('department', e.target.value)}>{DEPTS.map(d => <option key={d}>{d}</option>)}</select></div>
        </div>
        <div className="grid-2" style={{ marginBottom: 14 }}>
          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Location</label><input className="input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Remote / London / Kigali" /></div>
          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Employment type</label><select className="input" value={form.type} onChange={e => set('type', e.target.value)}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
        </div>
        <div className="form-group"><label className="form-label">Salary / Compensation</label><input className="input" value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="e.g. RWF 800,000 – 1,200,000/month" /></div>
        <div className="form-group"><label className="form-label">Job description *</label><textarea className="input" style={{ minHeight: 100 }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Role overview, key responsibilities, team context…" /></div>
        <div className="form-group"><label className="form-label">Requirements & qualifications</label><textarea className="input" style={{ minHeight: 80 }} value={form.requirements} onChange={e => set('requirements', e.target.value)} placeholder="Education, years of experience, certifications…" /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Required skills <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(comma-separated)</span></label><input className="input" value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="Python, TensorFlow, AWS, Agile…" /></div>
      </Modal>

      <Confirm open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={doDelete} title="Remove position" message={`This will permanently remove "${deleteTarget?.title}". This action cannot be undone.`} />

      <div className="page-header">
        <div className="page-eyebrow">Recruitment</div>
        <h1 className="page-title">Job Listings</h1>
        <div className="page-sub">Manage all open positions, track applicant volumes, and control listing status.</div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input" style={{ width: 260 }} placeholder="Search positions…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="closed">Closed</option>
        </select>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-blue" onClick={openCreate}>+ Post new position</button>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ width: 24, height: 24, margin: '0 auto' }} /></div> :
        jobs.length === 0 ? <div className="card"><div className="card-body"><Empty icon="💼" title="No positions found" sub="Post your first job listing to start receiving candidates" action={<button className="btn btn-blue" onClick={openCreate}>Post a position</button>} /></div></div> :
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Position</th><th>Department</th><th>Location</th><th>Type</th><th>Applicants</th><th>Status</th><th>Posted</th><th style={{ width: 130 }}>Actions</th></tr></thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j._id} onClick={e => { if (e.target.tagName === 'BUTTON') return; }}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{j.title}</div>
                      {j.salary && <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{j.salary}</div>}
                    </td>
                    <td>{j.department}</td>
                    <td>{j.location}</td>
                    <td><span className="tag">{j.type}</span></td>
                    <td><span style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1rem', color: 'var(--primary2)' }}>{j.applicantCount}</span></td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><StatusDot status={j.status} /><span style={{ fontSize: '.78rem', color: 'var(--text2)', textTransform: 'capitalize' }}>{j.status}</span></div></td>
                    <td style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{new Date(j.createdAt).toLocaleDateString()}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(j)}>Edit</button>
                        <button className="btn btn-outline btn-sm" onClick={() => toggleStatus(j)}>{j.status === 'active' ? 'Pause' : 'Activate'}</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(j)}>✕</button>
                      </div>
                    </td>
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
