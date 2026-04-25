'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PlatformLayout from '../../components/layout/PlatformLayout';
import { Empty, ScoreRing, VerdictBadge, useToast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export function ApplicantDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/applications/mine')
      .then(result => setApplications(result.applications || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PlatformLayout>
      <div className="page-header">
        <div className="page-eyebrow">Applications</div>
        <h1 className="page-title">Track where each application stands</h1>
        <div className="page-sub">You can now apply inside the platform, wait for the recruiter to screen you, and then follow the resulting score, verdict, and status here.</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ width: 24, height: 24, margin: '0 auto' }} /></div>
      ) : applications.length === 0 ? (
        <div className="card"><div className="card-body"><Empty icon="CV" title="No applications yet" sub="Browse jobs and apply to join an employer's talent inbox." /></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {applications.map(item => (
            <div key={item._id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>{item.job?.title}</div>
                    <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: 4 }}>{item.job?.department} · {item.job?.location} · Applied {new Date(item.createdAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: '.84rem', color: 'var(--text2)', marginTop: 12 }}>
                      {item.screening ? (item.screening.summary || 'Your application has been screened.') : 'Your application has been submitted and is waiting for the recruiter to click Screen.'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {item.screening ? (
                      <>
                        <VerdictBadge verdict={item.screening.verdict} />
                        <ScoreRing score={item.screening.overallScore} size={48} />
                      </>
                    ) : (
                      <span className="badge badge-amber">Awaiting screening</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PlatformLayout>
  );
}

export function ApplicantJobs() {
  const { user } = useAuth();
  const { add: toast } = useToast();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [coverNote, setCoverNote] = useState({});
  const [submitting, setSubmitting] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [jobsResult, mineResult] = await Promise.all([
        api.get(`/jobs/public${search ? `?search=${encodeURIComponent(search)}` : ''}`),
        api.get('/applications/mine'),
      ]);
      setJobs(jobsResult.jobs || []);
      setApplications(Object.fromEntries((mineResult.applications || []).map(item => [item.job?._id, item])));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

  const apply = async (jobId) => {
    setSubmitting(jobId);
    try {
      const result = await api.post(`/applications/${jobId}`, { coverNote: coverNote[jobId] || '' });
      setApplications(prev => ({ ...prev, [jobId]: result.application }));
      toast(result.message || 'Application submitted.', 'success');
      router.refresh();
    } catch (err) {
      toast(err.message || 'Application failed.', 'error');
    } finally {
      setSubmitting('');
    }
  };

  const missingProfile = !user?.resumeText?.trim() && !user?.bio?.trim() && !(user?.skills || []).length;

  return (
    <PlatformLayout>
      <div className="page-header">
        <div className="page-eyebrow">Jobs</div>
        <h1 className="page-title">Browse jobs and enter employer talent inboxes</h1>
        <div className="page-sub">Apply once from your profile. Employers will see you in-app, then click Screen whenever they are ready to rank applicants.</div>
      </div>

      {missingProfile && <div className="alert alert-warn"><span>!</span>Add a profile summary, skills, or resume text in Profile before you apply.</div>}
      <input className="input" style={{ maxWidth: 420, marginBottom: 18 }} placeholder="Search jobs by title or department..." value={search} onChange={e => setSearch(e.target.value)} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ width: 24, height: 24, margin: '0 auto' }} /></div>
      ) : jobs.length === 0 ? (
        <div className="card"><div className="card-body"><Empty icon="Jobs" title="No jobs available" sub="New roles will appear here when employers publish them." /></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {jobs.map(job => (
            <div key={job._id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>{job.title}</div>
                    <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{job.employer?.company || job.employer?.name} · {job.department} · {job.location}</div>
                  </div>
                  {applications[job._id] ? <span className="badge badge-green">Applied</span> : null}
                </div>
                <div style={{ fontSize: '.84rem', color: 'var(--text2)', lineHeight: 1.7, marginBottom: 12 }}>{job.description}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  <span className="tag">{job.type}</span>
                  {job.salary ? <span className="tag">{job.salary}</span> : null}
                  {(job.skills || []).map(skill => <span key={skill} className="tag">{skill}</span>)}
                </div>
                {!applications[job._id] && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <textarea className="input" style={{ minHeight: 90 }} value={coverNote[job._id] || ''} onChange={e => setCoverNote(prev => ({ ...prev, [job._id]: e.target.value }))} placeholder="Optional cover note to the employer..." />
                    <button className="btn btn-blue" disabled={missingProfile || submitting === job._id} onClick={() => apply(job._id)}>
                      {submitting === job._id ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PlatformLayout>
  );
}

export function ApplicantProfile() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings');
  }, [router]);

  return (
    <PlatformLayout>
      <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ width: 24, height: 24, margin: '0 auto' }} /></div>
    </PlatformLayout>
  );
}
