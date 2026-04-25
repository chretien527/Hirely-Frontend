'use client';
import { useEffect, useRef, useState } from 'react';
import PlatformLayout from '../../components/layout/PlatformLayout';
import { useAuth } from '../../context/AuthContext';
import { Avatar, useToast } from '../../components/ui';
import { prepareMediaPayload } from '../../lib/fileUpload';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { add: toast } = useToast();
  const imageInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: '',
    company: '',
    jobTitle: '',
    headline: '',
    industry: '',
    location: '',
    bio: '',
    skills: '',
    linkedin: '',
    website: '',
    portfolioUrl: '',
    profileImage: '',
    featuredWork: '',
    interests: '',
    resumeText: '',
  });

  useEffect(() => {
    setForm({
      name: user?.name || '',
      company: user?.company || '',
      jobTitle: user?.jobTitle || '',
      headline: user?.headline || '',
      industry: user?.industry || '',
      location: user?.location || '',
      bio: user?.bio || '',
      skills: (user?.skills || []).join(', '),
      linkedin: user?.linkedin || '',
      website: user?.website || '',
      portfolioUrl: user?.portfolioUrl || '',
      profileImage: user?.profileImage || '',
      featuredWork: (user?.featuredWork || []).join('\n'),
      interests: (user?.interests || []).join(', '),
      resumeText: user?.resumeText || '',
    });
  }, [user]);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const uploadProfileImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const media = await prepareMediaPayload(file, { maxSizeMb: 8 });
      if (media.mediaType !== 'image') throw new Error('Please choose an image file for your profile photo.');
      set('profileImage', media.mediaUrl);
      toast('Profile photo ready.', 'success');
    } catch (err) {
      toast(err.message || 'Could not use that image.', 'error');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateUser({
        ...form,
        skills: form.skills.split(',').map(item => item.trim()).filter(Boolean),
        featuredWork: form.featuredWork.split('\n').map(item => item.trim()).filter(Boolean),
        interests: form.interests.split(',').map(item => item.trim()).filter(Boolean),
      });
      toast('Profile saved.', 'success');
    } catch (err) {
      toast(err.message || 'Could not save your profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PlatformLayout>
      <div className="page-header">
        <div className="page-eyebrow">Profile</div>
        <h1 className="page-title">Shape how the platform sees you</h1>
        <div className="page-sub">This profile powers your public presence, your network card, your applications, and the work you share in the feed.</div>
      </div>

      <div className="card">
        <div className="card-header"><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Member profile</div></div>
        <div className="card-body">
          <div className="card-sm profile-upload" style={{ marginBottom: 16 }}>
            <Avatar name={form.name || user?.name || ''} size={84} imageSrc={form.profileImage} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Profile photo</div>
              <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: 10 }}>Upload a clear headshot or company profile picture from your computer.</div>
              <input ref={imageInputRef} type="file" className="hidden-file-input" accept="image/*" onChange={uploadProfileImage} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}>{uploadingImage ? 'Uploading...' : 'Browse files'}</button>
                {form.profileImage ? <button className="btn btn-ghost btn-sm" onClick={() => set('profileImage', '')}>Remove photo</button> : null}
              </div>
            </div>
          </div>
          <div className="grid-2" style={{ marginBottom: 14 }}>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Name</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Headline</label><input className="input" value={form.headline} onChange={e => set('headline', e.target.value)} placeholder="What should people know about you in one line?" /></div>
          </div>
          <div className="grid-2" style={{ marginBottom: 14 }}>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Organisation</label><input className="input" value={form.company} onChange={e => set('company', e.target.value)} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Job title</label><input className="input" value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} /></div>
          </div>
          <div className="grid-2" style={{ marginBottom: 14 }}>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Industry</label><input className="input" value={form.industry} onChange={e => set('industry', e.target.value)} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Location</label><input className="input" value={form.location} onChange={e => set('location', e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="form-label">Bio</label><textarea className="input" style={{ minHeight: 120 }} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Share your background, focus areas, and what you are building or hiring for." /></div>
          <div className="form-group"><label className="form-label">Skills</label><input className="input" value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="React, Talent acquisition, UX research, Node.js..." /></div>
          <div className="grid-2" style={{ marginBottom: 14 }}>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">LinkedIn URL</label><input className="input" value={form.linkedin} onChange={e => set('linkedin', e.target.value)} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Website</label><input className="input" value={form.website} onChange={e => set('website', e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="form-label">Portfolio or project URL</label><input className="input" value={form.portfolioUrl} onChange={e => set('portfolioUrl', e.target.value)} placeholder="A main link to your work, company site, or portfolio" /></div>
          <div className="form-group"><label className="form-label">Featured work</label><textarea className="input" style={{ minHeight: 110 }} value={form.featuredWork} onChange={e => set('featuredWork', e.target.value)} placeholder="One project or resource per line" /></div>
          <div className="form-group"><label className="form-label">Interests</label><input className="input" value={form.interests} onChange={e => set('interests', e.target.value)} placeholder="AI, hiring, community, product design..." /></div>
          {user?.role === 'applicant' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Resume text</label>
              <textarea className="input" style={{ minHeight: 180 }} value={form.resumeText} onChange={e => set('resumeText', e.target.value)} placeholder="This text will be used when employers screen your application." />
            </div>
          )}
        </div>
        <div className="card-footer">
          <button className="btn btn-blue" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
        </div>
      </div>
    </PlatformLayout>
  );
}
