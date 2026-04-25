'use client';
import { useEffect, useMemo, useState } from 'react';
import PlatformLayout from '../../components/layout/PlatformLayout';
import { AIReasoning, Avatar, Empty, FactorCard, HrBadge, Modal, ScoreRing, VerdictBadge, useToast } from '../../components/ui';
import api from '../../lib/api';

const STATUS_OPTIONS = ['submitted', 'screened', 'shortlisted', 'interviewed', 'offered', 'rejected'];

function ScreeningDetailModal({ item, rank, open, onClose }) {
  if (!open || !item?.screening) return null;
  const screening = item.screening;

  return (
    <Modal open={open} onClose={onClose} title={item.applicant?.name || 'Applicant'} subtitle={`${item.job?.title || ''} · Ranked #${rank || '-'}`} maxWidth={920}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={item.applicant?.name || 'Applicant'} size={54} imageSrc={item.applicant?.profileImage} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{item.applicant?.headline || item.applicant?.jobTitle || item.applicant?.company || 'Applicant'}</div>
            <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{item.applicant?.location || item.applicant?.email}</div>
          </div>
          <ScoreRing score={screening.overallScore || 0} size={56} />
          <VerdictBadge verdict={screening.verdict} />
        </div>

        <div className="card-sm">
          <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Explainable summary</div>
          <div style={{ fontSize: '.86rem', color: 'var(--text2)', lineHeight: 1.7 }}>{screening.summary || 'No summary was produced for this screening yet.'}</div>
        </div>

        <div className="grid-2">
          {(screening.factorScores || []).map(factor => (
            <FactorCard key={factor.name} name={factor.name} score={factor.score} note={factor.note} weight={factor.weight} />
          ))}
        </div>

        <div className="grid-2">
          <div className="card-sm">
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Strengths</div>
            {(screening.strengths || []).map((itemText, index) => <div key={index} style={{ fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.6, marginBottom: 8 }}>{itemText}</div>)}
          </div>
          <div className="card-sm">
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Concerns</div>
            {(screening.concerns || []).map((itemText, index) => <div key={index} style={{ fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.6, marginBottom: 8 }}>{itemText}</div>)}
          </div>
        </div>

        <AIReasoning steps={screening.aiReasoning || []} />
      </div>
    </Modal>
  );
}

export default function TalentPage() {
  const { add: toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [ranked, setRanked] = useState([]);
  const [shortlists, setShortlists] = useState([]);
  const [jobId, setJobId] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [jobsResult, inboxResult] = await Promise.all([
        api.get('/jobs'),
        api.get(`/applications/inbox${jobId || status ? `?${new URLSearchParams({ ...(jobId ? { jobId } : {}), ...(status ? { status } : {}) }).toString()}` : ''}`),
      ]);
      setJobs(jobsResult.jobs || []);
      setApplications(inboxResult.applications || []);
      setRanked(inboxResult.ranked || []);
      setShortlists(inboxResult.shortlists || []);
    } catch (err) {
      toast(err.message || 'Could not load applicants.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [jobId, status]);

  const rankMap = useMemo(() => Object.fromEntries(ranked.map(item => [String(item.applicationId), item.rank])), [ranked]);
  const selectedJob = jobs.find(job => job._id === jobId) || null;
  const pending = applications.filter(item => !item.screening);
  const screenedGroups = useMemo(() => {
    const grouped = applications
      .filter(item => item.screening)
      .reduce((acc, item) => {
        const key = String(item.job?._id || 'unassigned');
        if (!acc[key]) acc[key] = { job: item.job, items: [] };
        acc[key].items.push(item);
        return acc;
      }, {});

    return Object.values(grouped)
      .map(group => ({
        ...group,
        items: group.items.sort((a, b) => (rankMap[a._id] || 999) - (rankMap[b._id] || 999)),
      }))
      .sort((a, b) => String(a.job?.title || '').localeCompare(String(b.job?.title || '')));
  }, [applications, rankMap]);

  const screenApplicant = async (id) => {
    try {
      const result = await api.post(`/applications/${id}/screen`);
      if (!result.application?.job) {
        console.warn('Screened application missing job metadata', result);
      }
      toast('Applicant screened and ranked immediately.', 'success');
      setSelected(result.application);
      load();
    } catch (err) {
      toast(err.message || 'Screening failed.', 'error');
    }
  };

  const screenAllPending = async () => {
    if (!pending.length) return;
    try {
      setLoading(true);
      await Promise.all(pending.map(item => api.post(`/applications/${item._id}/screen`)));
      toast('All waiting applicants were screened and ranked.', 'success');
    } catch (err) {
      toast(err.message || 'Bulk screening failed.', 'error');
    } finally {
      load();
    }
  };

  const updateStatus = async (id, nextStatus) => {
    try {
      const result = await api.put(`/applications/${id}/status`, { status: nextStatus });
      toast(nextStatus === 'shortlisted' ? 'Applicant added to the shortlist for this job.' : 'Application status updated.', 'success');
      setSelected(prev => prev?._id === result.application?._id ? result.application : prev);
      load();
    } catch (err) {
      toast(err.message || 'Could not update status.', 'error');
    }
  };

  return (
    <PlatformLayout>
      <ScreeningDetailModal item={selected} rank={rankMap[selected?._id]} open={!!selected} onClose={() => setSelected(null)} />

      <div className="page-header">
        <div className="page-eyebrow">Talent Hub</div>
        <h1 className="page-title">Review applicants, screen them, and shortlist them by job</h1>
        <div className="page-sub">Every applicant is ranked against the specific job they applied for. Shortlists are now separated job by job, with explainable screening details for each person.</div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
        <button type="button" className={`btn btn-sm ${!jobId ? 'btn-blue' : 'btn-outline'}`} onClick={() => setJobId('')}>All jobs</button>
        {jobs.map((job, index) => (
          <button key={job?._id || index} type="button" className={`btn btn-sm ${job?._id === jobId ? 'btn-blue' : 'btn-outline'}`} onClick={() => job?._id && setJobId(job._id)}>
            {job?.title || 'Untitled job'}
          </button>
        ))}
      </div>

      {selectedJob ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedJob?.title || 'Untitled job'}</div>
            <div style={{ color: 'var(--muted)', fontSize: '.92rem' }}>{selectedJob?.location || 'Unknown location'} · {selectedJob?.type || 'Unknown type'} · {selectedJob?.department || 'Unknown department'}</div>
          </div>
          <button className="btn btn-blue btn-sm" onClick={screenAllPending} disabled={!pending.length}>Screen all waiting applicants</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
          <div style={{ color: 'var(--muted)', fontSize: '.95rem' }}>Showing applicants across all jobs. Pick a job above to narrow the review.</div>
          <button className="btn btn-blue btn-sm" onClick={screenAllPending} disabled={!pending.length}>Screen all waiting applicants</button>
        </div>
      )}

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {[
          ['Applicants', applications.length, 'var(--primary2)'],
          ['Waiting to screen', pending.length, 'var(--amber)'],
          ['Screened', screenedGroups.reduce((sum, group) => sum + group.items.length, 0), 'var(--green)'],
          ['Shortlisted', applications.filter(item => item.status === 'shortlisted').length, 'var(--sky)'],
        ].map(([label, value, color]) => (
          <div key={label} className="kpi">
            <div className="kpi-val" style={{ color }}>{value}</div>
            <div className="kpi-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 260 }} value={jobId} onChange={e => setJobId(e.target.value)}>
          <option value="">All jobs</option>
          {jobs.map((job, index) => <option key={job?._id || index} value={job?._id || ''}>{job?.title || 'Untitled job'}</option>)}
        </select>
        <select className="input" style={{ width: 220 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All application states</option>
          {STATUS_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ width: 24, height: 24, margin: '0 auto' }} /></div>
      ) : applications.length === 0 ? (
        <div className="card"><div className="card-body"><Empty icon="Talent" title="No applicants yet" sub="Once applicants start applying to your jobs, they will show up here for screening." /></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="talent-grid">
            <div className="card">
              <div className="card-header"><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Applicants waiting for screening</div></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pending.length === 0 ? (
                  <Empty icon="Queue" title="Everything has been screened" sub="New applicants will appear here automatically." />
                ) : (
                  pending.map(item => (
                    <div key={item._id} className="card-sm" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                        <Avatar name={item.applicant?.name || 'Applicant'} size={42} imageSrc={item.applicant?.profileImage} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>{item.applicant?.name}</div>
                          <div style={{ fontSize: '.76rem', color: 'var(--muted)' }}>{item.job?.title} · {item.applicant?.headline || item.applicant?.jobTitle || item.applicant?.company || 'Applicant'}</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>Applied {new Date(item.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>{item.applicant?.bio || 'No summary yet.'}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {(item.applicant?.skills || []).slice(0, 5).map(skill => <span key={skill} className="tag">{skill}</span>)}
                      </div>
                      <button className="btn btn-blue" onClick={() => screenApplicant(item._id)}>Screen applicant</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Screened applicants and ranking</div></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {screenedGroups.length === 0 ? (
                  <Empty icon="Rank" title="No screened applicants yet" sub="Click Screen applicant on the left to generate rankings." />
                ) : (
                  screenedGroups.map(group => (
                    <div key={group.job?._id || group.job?.title} className="card-sm" style={{ padding: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                        <div>
                          <button type="button" onClick={() => setJobId(group.job?._id || '')} style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary2)', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                            {group.job?.title || 'Job'}
                          </button>
                          <div style={{ fontSize: '.76rem', color: 'var(--muted)' }}>Applicants below are ranked only against others who applied for this same job.</div>
                        </div>
                        <div className="badge badge-blue">{group.items.length} screened</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {group.items.map(item => (
                          <div key={item._id} className="card" style={{ boxShadow: 'none' }}>
                            <div className="card-body" style={{ padding: 16 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                <div className="badge badge-green">Rank #{rankMap[item._id] || '-'}</div>
                                <Avatar name={item.applicant?.name || 'Applicant'} size={42} imageSrc={item.applicant?.profileImage} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700 }}>{item.applicant?.name}</div>
                                  <div style={{ fontSize: '.76rem', color: 'var(--muted)' }}>{item.applicant?.headline || item.applicant?.jobTitle || item.applicant?.company || 'Applicant'}</div>
                                </div>
                                <ScoreRing score={item.screening?.overallScore || 0} size={46} />
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                                <VerdictBadge verdict={item.screening?.verdict} />
                                <HrBadge status={item.screening?.hrStatus || item.status} />
                              </div>
                              <div style={{ fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>{item.screening?.summary || 'Screening completed.'}</div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <select className="input" style={{ width: 190 }} value={item.status} onChange={e => updateStatus(item._id, e.target.value)}>
                                  {STATUS_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                </select>
                                <button className="btn btn-outline" onClick={() => setSelected(item)}>View explanation</button>
                                <button
                                  className="btn btn-ghost"
                                  onClick={async () => {
                                    await api.post('/messages', { recipientId: item.applicant?._id, body: `Hello ${item.applicant?.name}, we have reviewed your application for ${item.job?.title}.` });
                                    toast('Message sent to applicant.', 'success');
                                  }}
                                >
                                  Message applicant
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Shortlists by job</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {shortlists.length === 0 ? (
                <Empty icon="List" title="No job shortlists yet" sub="Shortlisted applicants will appear under the specific jobs they applied for." />
              ) : (
                shortlists.map(group => (
                  <div key={group.jobId} className="card-sm" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>{group.job?.title || 'Job'}</div>
                        <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{group.shortlisted.length} shortlisted · {group.screenedCount} screened · {group.applicantCount} total applicants</div>
                      </div>
                      <span className="badge badge-blue">Job shortlist</span>
                    </div>
                    {group.shortlisted.length === 0 ? (
                      <div style={{ fontSize: '.84rem', color: 'var(--muted)' }}>Nobody has been shortlisted for this job yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {group.shortlisted.map(item => (
                          <div key={item._id} className="app-row" style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                            <Avatar name={item.applicant?.name || 'Applicant'} size={42} imageSrc={item.applicant?.profileImage} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700 }}>{item.applicant?.name}</div>
                              <div style={{ fontSize: '.76rem', color: 'var(--muted)' }}>Rank #{rankMap[item._id] || '-'} · Score {item.screening?.overallScore || 0}</div>
                            </div>
                            <button className="btn btn-outline btn-sm" onClick={() => setSelected(item)}>View explanation</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </PlatformLayout>
  );
}
