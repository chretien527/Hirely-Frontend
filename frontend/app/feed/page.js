'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PlatformLayout from '../../components/layout/PlatformLayout';
import { Avatar, Empty, MediaPreview, useToast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

function PostCard({ post, onLike, onBookmark, onComment, onShare, onDelete }) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const liked = (post.likes || []).some(id => String(id) === String(user?._id));
  const bookmarked = (post.bookmarks || []).some(id => String(id) === String(user?._id));

  return (
    <div className="card">
      <div className="card-body" style={{ padding: 22 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <Avatar name={post.author?.name || 'User'} size={42} imageSrc={post.author?.profileImage} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{post.author?.name}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
              {post.author?.headline || post.author?.jobTitle || post.author?.company || post.author?.role} · {new Date(post.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        {post.projectTitle && <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--primary2)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>{post.projectTitle}</div>}
        {post.body ? <div style={{ fontSize: '.95rem', color: 'var(--text2)', lineHeight: 1.7, marginBottom: 12 }}>{post.body}</div> : null}
        <MediaPreview post={post} />
        {post.resourceLink && (
          <a href={post.resourceLink} target="_blank" rel="noreferrer" className="card-sm" style={{ display: 'block', textDecoration: 'none', color: 'var(--primary2)', marginBottom: 12 }}>
            View attached resource
          </a>
        )}
        {!!post.tags?.length && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {post.tags.map(tag => <span key={tag} className="tag">#{tag}</span>)}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <button className={`btn btn-sm ${liked ? 'btn-blue' : 'btn-outline'}`} onClick={() => onLike(post._id)}>{liked ? 'Liked' : 'Like'} ({post.likes?.length || 0})</button>
          <button className={`btn btn-sm ${bookmarked ? 'btn-outline' : 'btn-ghost'}`} onClick={() => onBookmark(post._id)}>{bookmarked ? 'Saved' : 'Save'} ({post.bookmarks?.length || 0})</button>
          <button className="btn btn-outline btn-sm" onClick={() => onShare(post)}>Share ({post.shares || 0})</button>
          {String(post.author?._id) === String(user?._id) ? (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(post._id)}>Delete</button>
          ) : null}
          <div style={{ alignSelf: 'center', fontSize: '.8rem', color: 'var(--muted)' }}>{post.comments?.length || 0} comments</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input className="input" placeholder="Write a comment..." value={comment} onChange={e => setComment(e.target.value)} />
          <button
            className="btn btn-blue"
            onClick={async () => {
              if (!comment.trim()) return;
              await onComment(post._id, comment);
              setComment('');
            }}
          >
            Comment
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(post.comments || []).slice(-3).map(item => (
            <div key={item._id} className="card-sm" style={{ padding: 12 }}>
              <div style={{ fontSize: '.78rem', fontWeight: 700 }}>{item.author?.name || 'Member'}</div>
              <div style={{ fontSize: '.8rem', color: 'var(--text2)' }}>{item.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { add: toast } = useToast();
  const mediaInputRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [following, setFollowing] = useState([]);
  const [sharePost, setSharePost] = useState(null);
  const [selectedShareRecipients, setSelectedShareRecipients] = useState([]);
  const [shareNote, setShareNote] = useState('');
  const [followingLoading, setFollowingLoading] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState('');
  const [composer, setComposer] = useState({
    body: '',
    projectTitle: '',
    resourceLink: '',
    tags: '',
    mediaFile: null,
    mediaUrl: '',
    mediaType: '',
    mediaName: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.get('/platform/home');
      setData(result);
    } catch (err) {
      toast(err.message || 'Could not load the platform feed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFollowing = async () => {
    setFollowingLoading(true);
    try {
      const result = await api.get('/platform/following');
      setFollowing(result.following || []);
    } catch (err) {
      toast(err.message || 'Could not load your following list.', 'error');
    } finally {
      setFollowingLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadFollowing();
  }, []);

  const createPost = async () => {
    if (!composer.body.trim() && !composer.mediaFile && !composer.mediaUrl) return;
    try {
      let result;
      const tags = composer.tags.split(',').map(item => item.trim()).filter(Boolean);

      if (composer.mediaFile) {
        const formData = new FormData();
        formData.append('body', composer.body);
        formData.append('resourceLink', composer.resourceLink);
        formData.append('projectTitle', composer.projectTitle);
        formData.append('mediaType', composer.mediaType);
        formData.append('mediaName', composer.mediaName);
        composer.mediaFile && formData.append('mediaFile', composer.mediaFile);
        formData.append('mediaPoster', composer.mediaPoster);
        tags.forEach(tag => formData.append('tags', tag));

        result = await api.post('/platform/posts', formData);
      } else {
        result = await api.post('/platform/posts', {
          ...composer,
          tags,
        });
      }

      setData(prev => ({
        ...prev,
        stats: { ...(prev?.stats || {}), posts: (prev?.stats?.posts || 0) + 1 },
        feed: [result.post, ...(prev?.feed || [])],
      }));
      setComposer({ body: '', projectTitle: '', resourceLink: '', tags: '', mediaFile: null, mediaUrl: '', mediaType: '', mediaName: '' });
      toast('Your update is live.', 'success');
    } catch (err) {
      toast(err.message || 'Could not publish this post.', 'error');
    }
  };

  const syncPost = (post) => setData(prev => ({ ...prev, feed: (prev?.feed || []).map(item => item._id === post._id ? post : item) }));

  const toggleFollow = async (memberId) => {
    try {
      const result = await api.post(`/platform/follow/${memberId}`);
      setData(prev => ({
        ...prev,
        me: result.viewer || prev.me,
        stats: {
          ...(prev?.stats || {}),
          connections: ((result.viewer?.followerCount || prev?.me?.followerCount || 0) + (result.viewer?.followingCount || prev?.me?.followingCount || 0)),
        },
        suggestedUsers: (prev?.suggestedUsers || []).map(member => member._id === memberId ? result.member : member),
      }));
      toast(result.following ? 'Now following this member.' : 'Connection removed.', 'success');
      loadFollowing();
    } catch (err) {
      toast(err.message || 'Could not update this connection.', 'error');
    }
  };

  const openShareModal = (post) => {
    setSharePost(post);
    setSelectedShareRecipients([]);
    setShareNote(`Check out this post from ${post.author?.name}: ${post.body || post.projectTitle || 'View this update.'}`);
  };

  const closeShareModal = () => {
    setSharePost(null);
    setSelectedShareRecipients([]);
    setShareNote('');
  };

  const toggleShareRecipient = (id) => {
    setSelectedShareRecipients(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const sendShareMessage = async () => {
    if (!sharePost || selectedShareRecipients.length === 0) {
      toast('Choose at least one recipient to share with.', 'error');
      return;
    }

    try {
      await Promise.all(selectedShareRecipients.map(recipientId => api.post('/messages', {
        recipientId,
        body: `${shareNote}\n\nShared post: ${sharePost.body || sharePost.projectTitle || 'See this update on Hirely.'}`,
      })));
      closeShareModal();
      toast('Post shared with your selected connections.', 'success');
    } catch (err) {
      toast(err.message || 'Could not send the share messages.', 'error');
    }
  };

  const deletePost = async (postId) => {
    try {
      await api.delete(`/platform/posts/${postId}`);
      setData(prev => ({
        ...prev,
        feed: (prev?.feed || []).filter(item => String(item._id) !== String(postId)),
      }));
      toast('Post removed from your feed.', 'success');
    } catch (err) {
      toast(err.message || 'Could not delete the post.', 'error');
    }
  };

  const attachMedia = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) {
      toast('Please choose a file smaller than 500MB.', 'error');
      event.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const mime = file.type || '';
      const mediaType = mime.startsWith('video/') ? 'video' : mime.startsWith('image/') ? 'image' : 'document';
      setComposer(prev => ({
        ...prev,
        mediaFile: file,
        mediaType,
        mediaName: file.name,
        mediaUrl: '',
        mediaPoster: '',
      }));
      toast(`${file.name} is ready to post.`, 'success');
    } catch (err) {
      toast(err.message || 'Could not attach this file.', 'error');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  if (loading) {
    return <PlatformLayout><div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ width: 28, height: 28, margin: '0 auto' }} /></div></PlatformLayout>;
  }

  return (
    <PlatformLayout>
      <div className="page-header">
        <div className="page-eyebrow">Connected Platform</div>
        <h1 className="page-title">Professional feed for applicants and jobgivers</h1>
        <div className="page-sub">Share work, upload videos, discover talent, follow people, and keep hiring conversations inside one wide Hirely experience.</div>
      </div>

      {sharePost && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && closeShareModal()}>
          <div className="modal-box" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 2 }}>Share this post</div>
                <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>Choose followers to send this update to directly.</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={closeShareModal} style={{ fontSize: '1rem', lineHeight: 1 }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 14, color: 'var(--text2)' }}>{sharePost.body || sharePost.projectTitle || 'Shared update from your network.'}</div>
              <div className="form-group">
                <label className="form-label">Add a note</label>
                <textarea className="input" value={shareNote} onChange={e => setShareNote(e.target.value)} placeholder="Tell them why you are sharing this post..." style={{ minHeight: 90 }} />
              </div>
              <div style={{ display: 'grid', gap: 10, maxHeight: '360px', overflowY: 'auto', marginBottom: 14 }}>
                {followingLoading ? <div style={{ color: 'var(--muted)' }}>Loading people you follow...</div> : (
                  following.length === 0 ? <Empty icon="DM" title="No followings yet" sub="Follow people first to share posts with them directly." /> : following.map(member => (
                    <button
                      key={member._id}
                      type="button"
                      className="app-row"
                      style={{ width: '100%', background: selectedShareRecipients.includes(member._id) ? 'var(--primary-l)' : 'transparent', justifyContent: 'space-between' }}
                      onClick={() => toggleShareRecipient(member._id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={member.name} size={38} imageSrc={member.profileImage} />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 700 }}>{member.name}</div>
                          <div style={{ fontSize: '.74rem', color: 'var(--muted)' }}>{member.headline || member.jobTitle || member.company || member.role}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '.82rem', color: selectedShareRecipients.includes(member._id) ? 'var(--primary2)' : 'var(--muted)' }}>
                        {selectedShareRecipients.includes(member._id) ? 'Selected' : 'Select'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-outline" onClick={closeShareModal}>Cancel</button>
              <button className="btn btn-blue" onClick={sendShareMessage}>Send share</button>
            </div>
          </div>
        </div>
      )}

      <div className="platform-grid">
        <div className="feed-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <Avatar name={user?.name || ''} size={72} imageSrc={user?.profileImage} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginTop: 10 }}>{user?.name}</div>
              <div style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: 12 }}>{user?.headline || user?.jobTitle || user?.company || user?.role}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="card-sm"><div style={{ fontWeight: 700, color: 'var(--primary2)' }}>{data?.me?.followerCount || 0}</div><div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Followers</div></div>
                <div className="card-sm"><div style={{ fontWeight: 700, color: 'var(--green)' }}>{data?.me?.followingCount || 0}</div><div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Following</div></div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Platform stats</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Members', data?.stats?.members, 'var(--primary2)'],
                ['Posts', data?.stats?.posts, 'var(--amber)'],
                ['Open jobs', data?.stats?.jobs, 'var(--green)'],
                ['Your connections', data?.stats?.connections, 'var(--sky)'],
              ].map(([label, value, color]) => (
                <div key={label} className="card-sm" style={{ padding: 14 }}>
                  <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color }}>{value || 0}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="feed-main" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <Avatar name={user?.name || ''} size={44} imageSrc={user?.profileImage} />
                <textarea className="input" style={{ minHeight: 110 }} value={composer.body} onChange={e => setComposer(prev => ({ ...prev, body: e.target.value }))} placeholder="Share something you built, a hiring update, a resource, or a short pitch for yourself..." />
              </div>
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <input className="input" value={composer.projectTitle} onChange={e => setComposer(prev => ({ ...prev, projectTitle: e.target.value }))} placeholder="Project or post title" />
                <input className="input" value={composer.resourceLink} onChange={e => setComposer(prev => ({ ...prev, resourceLink: e.target.value }))} placeholder="Resource link" />
              </div>
              {(composer.mediaUrl || composer.mediaFile) ? (
                <div className="card-sm" style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Attached media</div>
                  {composer.mediaUrl ? (
                    <MediaPreview post={composer} />
                  ) : (
                    <div style={{ fontSize: '.95rem', color: 'var(--text2)', marginBottom: 10 }}>{composer.mediaName || composer.mediaFile?.name}</div>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setComposer(prev => ({ ...prev, mediaFile: null, mediaUrl: '', mediaType: '', mediaName: '' }))}>Remove media</button>
                  </div>
                </div>
              ) : null}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input className="input" value={composer.tags} onChange={e => setComposer(prev => ({ ...prev, tags: e.target.value }))} placeholder="tags, separated, by commas" />
                <input ref={mediaInputRef} type="file" className="hidden-file-input" accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx" onChange={attachMedia} />
                <button className="btn btn-outline" onClick={() => mediaInputRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading...' : 'Attach image or video'}</button>
                <button className="btn btn-blue" onClick={createPost}>Post update</button>
              </div>
            </div>
          </div>

          {(data?.feed || []).length === 0 ? (
            <div className="card"><div className="card-body"><Empty icon="Feed" title="Your feed is still quiet" sub="Follow members or publish the first post to start the conversation." /></div></div>
          ) : (
            (data?.feed || []).map(post => (
              <PostCard
                key={post._id}
                post={post}
                onLike={async (id) => syncPost((await api.post(`/platform/posts/${id}/like`)).post)}
                onBookmark={async (id) => syncPost((await api.post(`/platform/posts/${id}/bookmark`)).post)}
                onComment={async (id, content) => syncPost((await api.post(`/platform/posts/${id}/comment`, { content })).post)}
                onShare={(postData) => openShareModal(postData)}
                onDelete={deletePost}
              />
            ))
          )}
        </div>

        <div className="feed-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>People to connect with</div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => router.push('/network')}>
                Search people
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '0 16px 12px' }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 0 }}
                value={peopleSearch}
                onChange={e => setPeopleSearch(e.target.value)}
                placeholder="Search people by name, title, or company"
              />
              <button
                type="button"
                className="btn btn-blue btn-sm"
                disabled={!peopleSearch.trim()}
                onClick={() => router.push(`/network?search=${encodeURIComponent(peopleSearch.trim())}`)}
              >
                Go
              </button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data?.suggestedUsers || []).slice(0, 6).map(member => (
                <div key={member._id} className="card-sm" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <Avatar name={member.name} size={38} imageSrc={member.profileImage} />
                    <div style={{ flex: 1 }}>
                      <Link href={`/network?member=${member._id}`} style={{ fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>{member.name}</Link>
                      <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{member.headline || member.jobTitle || member.company || member.role}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{member.followingCount || 0} following</div>
                    </div>
                  </div>
                  <button className={`btn btn-sm ${member.isFollowing ? 'btn-outline' : 'btn-blue'}`} onClick={() => toggleFollow(member._id)}>
                    {member.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Open opportunities</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data?.jobs || []).map(job => (
                <div key={job._id} className="card-sm" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700 }}>{job.title}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: 8 }}>{job.employer?.company || job.employer?.name} · {job.location}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <span className="tag">{job.type}</span>
                    <span className="tag">{job.department}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}
