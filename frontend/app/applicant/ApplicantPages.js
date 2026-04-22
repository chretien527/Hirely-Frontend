'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle, Avatar, ToastProvider, VerdictBadge, ScoreRing, scoreColor, useToast, Empty } from '../../components/ui';
import api from '../../lib/api';
import { extractResumeText } from '../../lib/resumeUpload';

function ApplicantNav() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const links = [
    { href: '/applicant/dashboard', label: 'My Applications' },
    { href: '/applicant/jobs', label: 'Browse Positions' },
    { href: '/applicant/profile', label: 'My Profile' },
  ];

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <nav className="nav">
      <Link href="/applicant/dashboard" className="nav-brand" style={{ textDecoration: 'none' }}>
        <div className="nav-brand-mark">H</div>Hirely
      </Link>
      <div className="nav-links">
        {links.map(link => <Link key={link.href} href={link.href} className={`nav-link ${pathname === link.href ? 'active' : ''}`} style={{ textDecoration: 'none' }}>{link.label}</Link>)}
      </div>
      <div className="nav-right">
        <div style={{ padding: '4px 12px', background: 'var(--green-bg)', border: '1px solid var(--green-b)', borderRadius: 20, fontSize: '.72rem', fontWeight: 600, color: 'var(--green)' }}>Candidate Portal</div>
        <ThemeToggle />
        <button type="button" className="nav-user" onClick={handleLogout} title="Sign out" style={{ background: 'transparent' }}>
          <Avatar name={user?.name || ''} size={24} />
          <span style={{ fontSize: '.78rem', fontWeight: 500, color: 'var(--text2)' }}>{user?.name?.split(' ')[0]}</span>
          <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>Sign out</span>
        </button>
      </div>
    </nav>
  );
}

function ApplicantShell({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user?.role !== 'applicant') router.replace('/dashboard');
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
      <ApplicantNav />
      <div style={{ paddingTop: 60, maxWidth: 980, margin: '0 auto', padding: '80px 28px 40px' }}>
        {children}
      </div>
    </ToastProvider>
  );
}

export function ApplicantDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/screenings/my-results')
      .then(d => {
        setScreenings(d.screenings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stageMap = { pending: 1, shortlisted: 2, interviewed: 3, offered: 4, rejected: 1 };

  return (
    <ApplicantShell>
      <div className="page-header">
        <div className="page-eyebrow">Candidate Portal</div>
        <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]}</h1>
        <div className="page-sub">Track the status of your applications and review your AI evaluation results.</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner spinner-dark" style={{ width: 24, height: 24, margin: '0 auto' }} />
        </div>
      ) : screenings.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <Empty icon="CV" title="No applications on record" sub="Browse open positions and apply. Your evaluations will appear here once processed." action={<button className="btn btn-blue" onClick={() => router.push('/applicant/jobs')}>Browse positions</button>} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {screenings.map(screening => {
            const stage = stageMap[screening.hrStatus] || 1;
            const scoreColorValue = screening.overallScore >= 75 ? 'var(--green)' : screening.overallScore >= 50 ? 'var(--amber)' : 'var(--red)';
            const isExpanded = expanded === screening._id;
            return (
              <div key={screening._id} className="card">
                <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => setExpanded(isExpanded ? null : screening._id)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 3 }}>{screening.role}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>
                      Evaluated {new Date(screening.screenedAt).toLocaleDateString()}{screening.job?.department ? ` - ${screening.job.department}` : ''}
                    </div>
                  </div>
                  <VerdictBadge verdict={screening.verdict} />
                  <ScoreRing score={screening.overallScore} size={44} />
                  <span style={{ fontSize: '.75rem', color: 'var(--muted)', marginLeft: 4 }}>{isExpanded ? '^' : 'v'}</span>
                </div>

                <div style={{ padding: '0 22px 16px' }}>
                  <div className="pipeline">
                    {['Applied', 'AI Screened', 'Shortlisted', 'Interview', 'Decision'].map((label, index) => {
                      const done = index < stage;
                      const current = index === stage - 1;
                      return (
                        <div key={label} className="pipe-step">
                          <div className="pipe-node" style={{ background: done ? 'var(--primary)' : current ? 'var(--primary-l)' : 'var(--surface2)', borderColor: done || current ? 'var(--primary2)' : 'var(--border2)', color: done ? '#fff' : current ? 'var(--primary2)' : 'var(--muted)' }}>
                            {done ? 'OK' : index + 1}
                          </div>
                          <div className="pipe-label" style={{ color: done || current ? 'var(--primary2)' : 'var(--muted)' }}>{label}</div>
                          {index < 4 && <div className="pipe-line" style={{ background: done ? 'var(--primary2)' : 'var(--border)' }} />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '18px 22px', background: 'var(--bg)' }}>
                    <div style={{ padding: '12px 16px', background: screening.verdict === 'Advance' ? 'var(--green-bg)' : screening.verdict === 'Review' ? 'var(--amber-bg)' : 'var(--red-bg)', border: `1px solid ${screening.verdict === 'Advance' ? 'var(--green-b)' : screening.verdict === 'Review' ? 'var(--amber-b)' : 'var(--red-b)'}`, borderRadius: 6, marginBottom: 16 }}>
                      <div style={{ fontSize: '.8rem', fontWeight: 700, color: scoreColorValue, marginBottom: 4 }}>
                        {screening.verdict === 'Advance' ? 'Your application is advancing to the next stage.' : screening.verdict === 'Review' ? 'Your application is currently under further review.' : 'Thank you for your application. You have been notified of the outcome.'}
                      </div>
                      {screening.summary && <div style={{ fontSize: '.78rem', color: 'var(--text2)', lineHeight: 1.6, fontStyle: 'italic' }}>{screening.summary}</div>}
                    </div>

                    {screening.verdict !== 'Decline' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                        {(screening.factorScores || []).map(factor => {
                          const factorTone = scoreColor(factor.score);
                          return (
                            <div key={factor.name} className="card-sm" style={{ padding: 12 }}>
                              <div style={{ fontSize: '.68rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{factor.name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: factorTone, flexShrink: 0 }}>{Math.round(factor.score)}</div>
                                <div className="progress" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${factor.score}%`, background: factorTone }} /></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="card-sm">
                      <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Recommended next steps</div>
                      {(screening.verdict === 'Advance'
                        ? ['Expect an interview invitation within 2-3 business days.', 'Review the job description and prepare your key talking points.', 'Research the organisation and prepare thoughtful questions.', 'Ensure your professional references are available if requested.']
                        : screening.verdict === 'Review'
                          ? ['You may receive a follow-up assessment or additional questions.', 'Strengthen your portfolio with relevant work examples.', 'Consider expanding on technical skills mentioned in the role.']
                          : ['This outcome does not reflect your overall capabilities.', 'Review the role requirements to identify areas for development.', 'Consider applying for other positions that match your profile.', 'Seek feedback to improve your application for future opportunities.']
                      ).map((tip, index) => (
                        <div key={index} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: index < 2 ? '1px solid var(--border)' : 'none', fontSize: '.78rem', color: 'var(--text2)', lineHeight: 1.5 }}>
                          <span style={{ color: 'var(--primary2)', flexShrink: 0 }}>{'->'}</span>{tip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ApplicantShell>
  );
}

export function ApplicantJobs() {
  const { user } = useAuth();
  const { add: toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState({});
  const [submittingJobId, setSubmittingJobId] = useState('');

  useEffect(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/jobs/public${params}`)
      .then(d => {
        setJobs(d.jobs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search]);

  const applyToJob = async (job) => {
    setSubmittingJobId(job._id);
    try {
      const data = await api.post(`/screenings/apply/${job._id}`);
      setApplied(prev => ({ ...prev, [job._id]: data.screening }));
      toast(data.message || `Application submitted for "${job.title}".`, 'success');
    } catch (err) {
      if (err.screening) {
        setApplied(prev => ({ ...prev, [job._id]: err.screening }));
      }
      toast(err.message || 'Application failed.', 'error');
    } finally {
      setSubmittingJobId('');
    }
  };

  const missingResume = !user?.resumeText?.trim() && !user?.bio?.trim() && !(user?.skills || []).length;

  return (
    <ApplicantShell>
      <div className="page-header">
        <div className="page-eyebrow">Opportunities</div>
        <h1 className="page-title">Open Positions</h1>
        <div className="page-sub">Browse current vacancies. Applying now submits your profile and triggers immediate AI screening for the recruiter.</div>
      </div>

      {missingResume && (
        <div className="alert alert-warn">
          <span>!</span>
          Add your resume or profile details before applying so Hirely can screen you immediately.
        </div>
      )}

      <input className="input" style={{ marginBottom: 22, maxWidth: 400 }} placeholder="Search by title or department..." value={search} onChange={e => setSearch(e.target.value)} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner spinner-dark" style={{ width: 24, height: 24, margin: '0 auto' }} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <Empty icon="Jobs" title="No open positions" sub="Check back soon for new opportunities." />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {jobs.map(job => (
            <div key={job._id} className="card" style={{ transition: 'transform .15s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, marginBottom: 3 }}>{job.title}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{job.employer?.company || job.employer?.name} - {job.department}</div>
                  </div>
                  {applied[job._id] ? (
                    <span className="badge badge-green" style={{ fontSize: '.75rem' }}>Screened</span>
                  ) : (
                    <button className="btn btn-blue btn-sm" onClick={() => applyToJob(job)} disabled={submittingJobId === job._id || missingResume}>
                      {submittingJobId === job._id ? 'Screening...' : 'Apply now'}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.65, marginBottom: 12 }}>{job.description}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: applied[job._id] ? 12 : 0 }}>
                  <span className="tag">{job.location}</span>
                  <span className="tag">{job.type}</span>
                  {job.salary && <span className="tag">{job.salary}</span>}
                  {(job.skills || []).map(skill => <span key={skill} className="tag">{skill}</span>)}
                </div>
                {applied[job._id] && (
                  <div className="card-sm">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Immediate screening result</div>
                        <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{applied[job._id].summary || `Your profile was screened for ${job.title}.`}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <VerdictBadge verdict={applied[job._id].verdict} />
                        <ScoreRing score={applied[job._id].overallScore} size={46} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ApplicantShell>
  );
}

export function ApplicantProfile() {
  const { user, updateUser } = useAuth();
  const { add: toast } = useToast();
  const [form, setForm] = useState({ name: '', phone: '', location: '', bio: '', skills: '', linkedin: '', resumeText: '' });
  const [saving, setSaving] = useState(false);
  const [resumeFileName, setResumeFileName] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      location: user?.location || '',
      bio: user?.bio || '',
      skills: (user?.skills || []).join(', '),
      linkedin: user?.linkedin || '',
      resumeText: user?.resumeText || '',
    });
  }, [user]);

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    try {
      const text = await extractResumeText(file);
      setForm(f => ({ ...f, resumeText: text }));
      setResumeFileName(file.name);
      toast(`Attached ${file.name}.`, 'success');
    } catch (err) {
      toast(err.message || 'Could not read that file.', 'error');
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateUser({ ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) });
      toast('Profile updated.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
    setSaving(false);
  };

  return (
    <ApplicantShell>
      <div className="page-header">
        <div className="page-eyebrow">Account</div>
        <h1 className="page-title">My Profile</h1>
        <div className="page-sub">A complete profile improves AI screening accuracy. Keep your CV up to date.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 22, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-l)', color: 'var(--primary2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, margin: '0 auto 10px', border: '2px solid var(--primary-m)' }}>
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 3 }}>{user?.name}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: 10 }}>{user?.email}</div>
              <span className="badge badge-green">Active candidate</span>
            </div>
          </div>
          <div className="card-sm">
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Profile tips</div>
            {['Add detailed work experience', 'Include quantifiable achievements', 'List all relevant certifications', 'Keep your CV current'].map((tip, index) => (
              <div key={index} style={{ display: 'flex', gap: 8, fontSize: '.75rem', color: 'var(--text2)', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--primary2)' }}>*</span>{tip}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Personal Information</div></div>
          <div className="card-body">
            <div className="grid-2" style={{ marginBottom: 14 }}>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Full name</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Phone number</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+250 7XX XXX XXX" /></div>
            </div>
            <div className="form-group"><label className="form-label">Location</label><input className="input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="City, Country" /></div>
            <div className="form-group"><label className="form-label">Professional summary</label><textarea className="input" style={{ minHeight: 90 }} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="2-3 sentences describing your professional background and career goals." /></div>
            <div className="form-group"><label className="form-label">Skills <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(comma-separated)</span></label><input className="input" value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="Python, Project Management, Data Analysis, Agile..." /></div>
            <div className="form-group"><label className="form-label">LinkedIn profile URL</label><input className="input" value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/your-name" /></div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">CV / Resume text <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(used in AI evaluations)</span></label>
              <div className="upload-box">
                <div className="upload-copy">
                  <div className="upload-title">Attach a resume file</div>
                  <div className="upload-sub">Upload TXT, MD, RTF, CSV, or another plain-text document and we will fill the resume field for you.</div>
                  {resumeFileName && <div className="upload-meta">Current file: {resumeFileName}</div>}
                </div>
                <div className="upload-actions">
                  <input ref={fileInputRef} type="file" className="hidden-file-input" accept=".txt,.md,.rtf,.csv,.json,text/*" onChange={handleResumeUpload} />
                  <button type="button" className="btn btn-outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingResume}>
                    {uploadingResume ? 'Uploading...' : 'Attach file'}
                  </button>
                </div>
              </div>
              <textarea className="input" style={{ minHeight: 180, fontFamily: 'var(--font-mono)', fontSize: '.76rem', lineHeight: 1.7 }} value={form.resumeText} onChange={e => set('resumeText', e.target.value)} placeholder="Paste your full CV text here. This is submitted to AI evaluations when employers screen your profile." />
              <div className="form-hint">This text is used by employers during AI screening. You can paste directly or attach a plain-text resume file above.</div>
            </div>
          </div>
          <div className="card-footer"><button className="btn btn-blue" onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : null}Save profile</button></div>
        </div>
      </div>
    </ApplicantShell>
  );
}
