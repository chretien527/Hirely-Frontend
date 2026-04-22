'use client';
import { useState } from 'react';
import EmployerLayout from '../../components/layout/EmployerLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui';

const TABS = [['profile','Organisation Profile'],['ai','AI Configuration'],['notifications','Notifications'],['team','Team Access'],['security','Security']];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { add: toast } = useToast();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name||'', company: user?.company||'', jobTitle: user?.jobTitle||'', industry: user?.industry||'', location: user?.location||'' });
  const setP = (k,v) => setProfileForm(f => ({...f,[k]:v}));

  const saveProfile = async () => {
    setSaving(true);
    try { await updateUser(profileForm); toast('Profile updated successfully.', 'success'); }
    catch (err) { toast(err.message, 'error'); }
    setSaving(false);
  };

  const TEAM = [
    { name:'Dr. Amara Diallo', title:'Chief People Officer', email:'amara@corp.com', role:'Admin' },
    { name:'Thomas Mbeki', title:'Senior HR Manager', email:'thomas@corp.com', role:'Editor' },
    { name:'Yuki Tanaka', title:'Talent Acquisition Lead', email:'yuki@corp.com', role:'Viewer' },
  ];

  return (
    <EmployerLayout>
      <div className="page-header">
        <div className="page-eyebrow">Configuration</div>
        <h1 className="page-title">Platform Settings</h1>
        <div className="page-sub">Manage your organisation profile, AI evaluation parameters, team access, and platform preferences.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>
        <div className="card">
          <div className="card-body" style={{ padding: '8px' }}>
            {TABS.map(([k,l]) => (
              <div key={k} onClick={() => setTab(k)} className={`s-item ${tab===k?'active':''}`}>{l}</div>
            ))}
            <hr style={{ margin: '10px 0' }} />
            <div style={{ padding: '10px', background: 'var(--bg2)', borderRadius: 6 }}>
              <div style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Signed in as</div>
              <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text2)' }}>{user?.name}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{user?.email}</div>
            </div>
          </div>
        </div>

        <div>
          {tab === 'profile' && (
            <div className="card">
              <div className="card-header"><div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1rem' }}>Organisation Profile</div><div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 2 }}>This information is used in AI prompts and candidate communications.</div></div>
              <div className="card-body">
                <div className="grid-2" style={{ marginBottom: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}><label className="form-label">Your full name</label><input className="input" value={profileForm.name} onChange={e => setP('name', e.target.value)} /></div>
                  <div className="form-group" style={{ margin: 0 }}><label className="form-label">Job title</label><input className="input" value={profileForm.jobTitle} onChange={e => setP('jobTitle', e.target.value)} placeholder="e.g. Chief Human Resources Officer" /></div>
                </div>
                <div className="grid-2" style={{ marginBottom: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}><label className="form-label">Organisation name</label><input className="input" value={profileForm.company} onChange={e => setP('company', e.target.value)} /></div>
                  <div className="form-group" style={{ margin: 0 }}><label className="form-label">Industry sector</label><select className="input" value={profileForm.industry} onChange={e => setP('industry', e.target.value)}><option value="">Select industry</option>{['Technology','Financial Services','Healthcare','Education','Government','NGO / Non-profit','Manufacturing','Consulting','Legal','Media & Communications'].map(i => <option key={i}>{i}</option>)}</select></div>
                </div>
                <div className="form-group"><label className="form-label">Headquarters location</label><input className="input" value={profileForm.location} onChange={e => setP('location', e.target.value)} placeholder="e.g. Kigali, Rwanda" /></div>
                <button className="btn btn-blue" onClick={saveProfile} disabled={saving}>{saving?<span className="spinner"/>:null}Save profile</button>
              </div>
            </div>
          )}

          {tab === 'ai' && (
            <div className="card">
              <div className="card-header"><div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1rem' }}>AI Evaluation Configuration</div><div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 2 }}>Configure how the AI evaluates candidates. Changes apply to all future screenings.</div></div>
              <div className="card-body">
                <div className="form-group"><label className="form-label">AI Model</label><select className="input"><option>Claude Sonnet 4 — Balanced accuracy and speed (recommended)</option><option>Claude Opus 4 — Maximum evaluation depth (slower)</option><option>Claude Haiku 4.5 — Fast screening for high volume</option></select><div className="form-hint">Model selection affects evaluation depth and processing time.</div></div>
                <div className="form-group"><label className="form-label">Evaluation strictness</label><select className="input"><option>Standard — Balanced scoring across all criteria</option><option>Stringent — Higher bar for Advance verdicts (≥ 80)</option><option>Inclusive — Lower bar to surface more candidates (≥ 65)</option></select></div>
                <div className="form-group"><label className="form-label">Organisation context <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label><textarea className="input" style={{ minHeight: 90 }} placeholder="Describe your organisation's values, culture, or any additional context the AI should consider during candidate evaluation…" /></div>
                <hr />
                {[['Generate interview questions','Automatically produce targeted interview questions for every evaluation'],['Include strengths & concerns','Require AI to document specific strengths and concerns per candidate'],['Require reasoning documentation','Mandate full step-by-step AI evaluation chain for auditability']].map(([l,d]) => (
                  <div key={l} className="setting-row">
                    <div><div className="setting-label">{l}</div><div className="setting-desc">{d}</div></div>
                    <label className="toggle"><input type="checkbox" defaultChecked /><span className="toggle-track" /></label>
                  </div>
                ))}
                <button className="btn btn-blue" style={{ marginTop: 18 }} onClick={() => toast('AI configuration saved.', 'success')}>Save configuration</button>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="card">
              <div className="card-header"><div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1rem' }}>Notification Preferences</div></div>
              <div className="card-body">
                <div className="form-group"><label className="form-label">Notification email</label><input className="input" type="email" defaultValue={user?.email} /></div>
                <hr />
                {[['Evaluation completed','Receive an alert when a candidate evaluation is processed',true],['Advance verdict','Alert immediately when a candidate receives an Advance verdict',true],['Weekly digest','Summary report of all recruitment activity every Monday morning',false],['Low pipeline alert','Notify when the advance pipeline drops below 3 candidates',false]].map(([l,d,def]) => (
                  <div key={l} className="setting-row">
                    <div><div className="setting-label">{l}</div><div className="setting-desc">{d}</div></div>
                    <label className="toggle"><input type="checkbox" defaultChecked={def} /><span className="toggle-track" /></label>
                  </div>
                ))}
                <button className="btn btn-blue" style={{ marginTop: 18 }} onClick={() => toast('Notification preferences saved.', 'success')}>Save preferences</button>
              </div>
            </div>
          )}

          {tab === 'team' && (
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Team Access</div><div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 2 }}>Manage who has access to Hirely in your organisation.</div></div>
                <button className="btn btn-blue btn-sm" onClick={() => toast('Invitation sent.', 'success')}>+ Invite member</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Member</th><th>Title</th><th>Access role</th><th>Status</th></tr></thead>
                  <tbody>
                    {TEAM.map(m => (
                      <tr key={m.email}>
                        <td><div><div style={{ fontWeight: 600, color: 'var(--text)' }}>{m.name}</div><div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{m.email}</div></div></td>
                        <td style={{ color: 'var(--text2)' }}>{m.title}</td>
                        <td><span className={`badge ${m.role==='Admin'?'badge-blue':m.role==='Editor'?'badge-amber':'badge-gray'}`}>{m.role}</span></td>
                        <td><span className="badge badge-green">Active</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="card">
              <div className="card-header"><div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1rem' }}>Security Settings</div></div>
              <div className="card-body">
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Change Password</div>
                <div className="form-group"><label className="form-label">Current password</label><input className="input" type="password" /></div>
                <div className="form-group"><label className="form-label">New password</label><input className="input" type="password" /></div>
                <div className="form-group"><label className="form-label">Confirm new password</label><input className="input" type="password" /></div>
                <button className="btn btn-outline" onClick={() => toast('Password changed.', 'success')}>Update password</button>
                <hr />
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Session Management</div>
                <div className="setting-row"><div><div className="setting-label">Active sessions</div><div className="setting-desc">You are currently signed in on 1 device.</div></div><button className="btn btn-danger btn-sm" onClick={() => toast('All other sessions terminated.', 'success')}>Revoke all</button></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </EmployerLayout>
  );
}
