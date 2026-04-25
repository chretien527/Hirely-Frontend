'use client';
import { useEffect, useMemo, useState } from 'react';
import PlatformLayout from '../../components/layout/PlatformLayout';
import { Avatar, Empty, useToast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function MessagesPage() {
  const { user } = useAuth();
  const { add: toast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [recipientId, setRecipientId] = useState('');

  const searchMembers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const result = await api.get(`/platform/members?search=${encodeURIComponent(query)}`);
      setSearchResults(result.members || []);
    } catch (err) {
      toast(err.message || 'Could not search members.', 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.get('/messages');
      setConversations(result.conversations || []);
      if (!selectedId && result.conversations?.[0]?._id) setSelectedId(result.conversations[0]._id);
    } catch (err) {
      toast(err.message || 'Could not load messages.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selected = useMemo(() => conversations.find(item => item._id === selectedId) || null, [conversations, selectedId]);
  const otherParticipant = selected?.participants?.find(item => item._id !== user?._id);
  const currentRecipient = selectedMember || otherParticipant;

  const send = async () => {
    const targetId = recipientId || selectedMember?._id || otherParticipant?._id;
    if (!targetId || !draft.trim()) return;
    try {
      const result = await api.post('/messages', { recipientId: targetId, body: draft });
      setDraft('');
      setRecipientId('');
      setSelectedId(result.conversation._id);
      await load();
    } catch (err) {
      toast(err.message || 'Message failed to send.', 'error');
    }
  };

  return (
    <PlatformLayout>
      <div className="page-header">
        <div className="page-eyebrow">Messaging</div>
        <h1 className="page-title">Direct conversations across the platform</h1>
        <div className="page-sub">Applicants, organisations, and jobgivers can all message each other here without leaving the app.</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ width: 24, height: 24, margin: '0 auto' }} /></div>
      ) : (
        <div className="messages-grid" style={{ minHeight: 620 }}>
          <div className="card">
            <div className="card-header"><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Inbox</div></div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="card-sm" style={{ margin: 0, borderRadius: '0 0 0 0', borderTop: 'none' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      if (!e.target.value.trim()) setSearchResults([]);
                    }}
                    placeholder="Search members to message"
                  />
                  <button className="btn btn-outline btn-sm" onClick={() => searchMembers(searchTerm)} disabled={!searchTerm.trim() || searchLoading}>
                    {searchLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {searchResults.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {searchResults.map(member => (
                      <div key={member._id} className="app-row" style={{ width: '100%', background: selectedMember?._id === member._id ? 'var(--primary-l)' : 'transparent' }}>
                        <Avatar name={member.name} size={38} imageSrc={member.profileImage} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>{member.name}</div>
                          <div style={{ fontSize: '.74rem', color: 'var(--muted)' }}>{member.headline || member.jobTitle || member.company || member.role}</div>
                        </div>
                        <button className="btn btn-blue btn-sm" onClick={() => {
                          setRecipientId(member._id);
                          setSelectedId('');
                          setSelectedMember(member);
                          setSearchResults([]);
                          setSearchTerm('');
                        }}>
                          Message
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '12px 0', color: 'var(--muted)', fontSize: '.9rem' }}>Search members by name, company, or title to begin a new conversation.</div>
                )}
              </div>

              {conversations.length === 0 ? (
                <div style={{ padding: 24 }}><Empty icon="DM" title="No messages yet" sub="Search for a member or paste a member id to start messaging." /></div>
              ) : (
                conversations.map(conversation => {
                  const peer = conversation.participants.find(item => item._id !== user?._id) || conversation.participants[0];
                  const lastMessage = conversation.messages?.[conversation.messages.length - 1];
                  return (
                    <button
                      key={conversation._id}
                      type="button"
                      className="app-row"
                      style={{ width: '100%', background: conversation._id === selectedId ? 'var(--primary-l)' : 'transparent', textAlign: 'left' }}
                      onClick={() => {
                        setSelectedId(conversation._id);
                        setSelectedMember(null);
                        setRecipientId('');
                      }}
                    >
                      <Avatar name={peer?.name || 'Member'} size={38} imageSrc={peer?.profileImage} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{peer?.name || 'Member'}</div>
                        <div style={{ fontSize: '.74rem', color: 'var(--muted)' }}>{peer?.headline || peer?.jobTitle || peer?.company || peer?.role}</div>
                        <div style={{ fontSize: '.76rem', color: 'var(--text2)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lastMessage?.body || 'No messages yet'}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={currentRecipient?.name || 'New chat'} size={42} imageSrc={currentRecipient?.profileImage} />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{currentRecipient?.name || 'Start a new conversation'}</div>
                <div style={{ fontSize: '.76rem', color: 'var(--muted)' }}>{currentRecipient?.headline || currentRecipient?.jobTitle || currentRecipient?.company || 'Search for a member or paste a member id to begin.'}</div>
              </div>
            </div>
            <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!selected && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Recipient member id</label>
                  <input className="input" value={recipientId} onChange={e => setRecipientId(e.target.value)} placeholder="Paste a member id from the network response to start messaging" />
                </div>
              )}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', minHeight: 340 }}>
                {selected ? (
                  (selected.messages || []).map(message => {
                    const mine = message.sender?._id === user?._id;
                    return (
                      <div key={message._id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '72%' }}>
                        <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginBottom: 4 }}>{mine ? 'You' : message.sender?.name}</div>
                        <div style={{ background: mine ? 'var(--primary2)' : 'var(--surface2)', color: mine ? '#fff' : 'var(--text2)', padding: '12px 14px', borderRadius: 14, border: mine ? 'none' : '1px solid var(--border)' }}>
                          {message.body}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <Empty icon="Chat" title="Pick a conversation" sub="Your messages will appear here." />
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <textarea className="input" style={{ minHeight: 84 }} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Write a message..." />
                <button className="btn btn-blue" onClick={send}>Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PlatformLayout>
  );
}
