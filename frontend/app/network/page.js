'use client';
import { useEffect, useState } from 'react';
import PlatformLayout from '../../components/layout/PlatformLayout';
import { Avatar, Empty, MediaPreview, Modal, useToast } from '../../components/ui';
import api from '../../lib/api';

export default function NetworkPage() {
  const { add: toast } = useToast();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (role) params.set('role', role);
      const result = await api.get(`/platform/members${params.toString() ? `?${params}` : ''}`);
      setMembers(result.members || []);
    } catch (err) {
      toast(err.message || 'Could not load members.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, role]);

  useEffect(() => {
    const memberId = new URLSearchParams(window.location.search).get('member');
    if (memberId) {
      openProfile(memberId);
    }
  }, []);

  const openProfile = async (id) => {
    try {
      const result = await api.get(`/platform/profile/${id}`);
      setSelected(result);
    } catch (err) {
      toast(err.message || 'Could not open this profile.', 'error');
    }
  };

  return (
    <PlatformLayout>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.profile?.name || 'Member profile'}
        subtitle={selected?.profile?.headline || selected?.profile?.jobTitle || selected?.profile?.company || ''}
        maxWidth={720}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <Avatar name={selected.profile.name} size={68} imageSrc={selected.profile.profileImage} />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>{selected.profile.name}</div>
                <div style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{selected.profile.headline || selected.profile.jobTitle || selected.profile.company || selected.profile.role}</div>
              </div>
            </div>
            <div className="grid-2">
              <div className="card-sm">
                <div style={{ fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>About</div>
                <div style={{ fontSize: '.85rem', color: 'var(--text2)' }}>{selected.profile.bio || 'No bio added yet.'}</div>
              </div>
              <div className="card-sm">
                <div style={{ fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Highlights</div>
                <div style={{ fontSize: '.85rem', color: 'var(--text2)' }}>
                  Followers: {selected.profile.followerCount || 0}<br />
                  Following: {selected.profile.followingCount || 0}<br />
                  {selected.profile.role === 'employer' ? `Open jobs: ${selected.applicationStats?.openJobs || 0}` : `Applications: ${selected.applicationStats?.applications || 0}`}
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Recent posts</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(selected.posts || []).map(post => (
                  <div key={post._id} className="card-sm">
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{post.projectTitle || 'Post'}</div>
                    <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{post.body}</div>
                    <div style={{ marginTop: 8 }}><MediaPreview post={post} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <div className="page-header">
        <div className="page-eyebrow">Network</div>
        <h1 className="page-title">Meet candidates, jobgivers, and organisations in one place</h1>
        <div className="page-sub">Search across the platform, follow people, and open profiles to discover work, hiring activity, and shared resources.</div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <input className="input" style={{ width: 340 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, company, title, or headline..." />
        <select className="input" style={{ width: 180 }} value={role} onChange={e => setRole(e.target.value)}>
          <option value="">All members</option>
          <option value="applicant">Applicants</option>
          <option value="employer">Jobgivers</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ width: 24, height: 24, margin: '0 auto' }} /></div>
      ) : members.length === 0 ? (
        <div className="card"><div className="card-body"><Empty icon="People" title="No members match your search" sub="Try a different keyword or role filter." /></div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {members.map(member => (
            <div key={member._id} className="card">
              <div className="card-body" style={{ padding: 22 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <Avatar name={member.name} size={50} imageSrc={member.profileImage} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{member.name}</div>
                    <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{member.headline || member.jobTitle || member.company || member.role}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{member.location || member.industry || 'Platform member'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {(member.skills || []).slice(0, 4).map(skill => <span key={skill} className="tag">{skill}</span>)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.76rem', color: 'var(--muted)', marginBottom: 12 }}>
                  <span>{member.followerCount || 0} followers</span>
                  <span>{member.followingCount || 0} following</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button
                    className={`btn btn-sm ${member.isFollowing ? 'btn-outline' : 'btn-blue'}`}
                    style={{ flex: '1 1 120px', minWidth: 110 }}
                    onClick={async () => {
                      const result = await api.post(`/platform/follow/${member._id}`);
                      setMembers(prev => prev.map(item => item._id === member._id ? result.member : item));
                      toast(member.isFollowing ? 'Connection removed.' : 'Now following this member.', 'success');
                    }}
                  >
                    {member.isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button className="btn btn-outline btn-sm" style={{ flex: '1 1 120px', minWidth: 110 }} onClick={() => openProfile(member._id)}>View profile</button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ flex: '1 1 120px', minWidth: 110 }}
                    onClick={async () => {
                      await api.post('/messages', { recipientId: member._id, body: 'Hello, I would like to connect with you on Hirely.' });
                      toast('Conversation started.', 'success');
                    }}
                  >
                    Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PlatformLayout>
  );
}
