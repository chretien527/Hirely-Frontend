'use client';
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

/* ── TOAST ── */
const ToastCtx = createContext({ add: () => {} });
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={{ add }}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <div className="t-dot" />
            <span style={{ fontSize: '.8rem', color: 'var(--text2)' }}>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ── THEME TOGGLE ── */
export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button className="theme-btn" onClick={toggle} title={dark ? 'Switch to light' : 'Switch to dark'}>
      {dark ? '☀' : '⏾'}
    </button>
  );
}

/* ── SCORE RING ── */
export function ScoreRing({ score, size = 44 }) {
  const r = size * 0.37, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const col = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
  return (
    <div className="sring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg2)" strokeWidth={size * 0.09} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={size * 0.09}
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25} strokeLinecap="round" />
      </svg>
      <div className="sring-label" style={{ color: col, fontSize: size * 0.22, position: 'relative' }}>
        {Math.round(score)}
      </div>
    </div>
  );
}

/* ── VERDICT BADGE ── */
export function VerdictBadge({ verdict }) {
  const cls = verdict === 'Advance' ? 'badge-green' : verdict === 'Review' ? 'badge-amber' : 'badge-red';
  return <span className={`badge ${cls}`}>{verdict}</span>;
}

/* ── HR STATUS BADGE ── */
export function HrBadge({ status }) {
  const map = { pending: 'badge-gray', shortlisted: 'badge-blue', interviewed: 'badge-amber', offered: 'badge-green', rejected: 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

/* ── MODAL ── */
export function Modal({ open, onClose, title, subtitle, maxWidth = 560, children, footer }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth }}>
        <div className="modal-header">
          <div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1.05rem', marginBottom: 2 }}>{title}</div>
            {subtitle && <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{subtitle}</div>}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: '1rem', lineHeight: 1 }}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ── CONFIRM MODAL ── */
export function Confirm({ open, onClose, onConfirm, title, message }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth={400}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-danger" onClick={() => { onConfirm(); onClose(); }}>Confirm</button></>}>
      <p style={{ fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

/* ── EMPTY STATE ── */
export function Empty({ icon, title, sub, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title serif">{title}</div>
      <div className="empty-sub">{sub}</div>
      {action}
    </div>
  );
}

/* ── STATUS DOT ── */
export function StatusDot({ status }) {
  const cls = status === 'active' ? 'sdot-green' : status === 'paused' ? 'sdot-amber' : 'sdot-red';
  return <span className={`sdot ${cls}`} />;
}

/* ── AVATAR ── */
export function Avatar({ name = '', size = 32, color = '#1e3a5f' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, background: color + '18', color, fontSize: size * 0.35, border: `1px solid ${color}30` }}>
      {initials}
    </div>
  );
}

/* ── SCORE COLOR ── */
export const scoreColor = s => s >= 75 ? 'var(--green)' : s >= 50 ? 'var(--amber)' : 'var(--red)';

/* ── FACTOR SCORE CARD ── */
export function FactorCard({ name, score, note, weight }) {
  const col = scoreColor(score);
  return (
    <div className="card-sm" style={{ padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', flex: 1, paddingRight: 8 }}>{name}</div>
        <div style={{ fontSize: '.68rem', color: 'var(--muted2)' }}>{weight}% weight</div>
      </div>
      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.4rem', fontWeight: 700, color: col, marginBottom: 6 }}>
        {Math.round(score)}<span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--muted)' }}>/100</span>
      </div>
      <div className="progress" style={{ marginBottom: 6 }}>
        <div className="progress-fill" style={{ width: `${score}%`, background: col }} />
      </div>
      {note && <div style={{ fontSize: '.75rem', color: 'var(--text2)', lineHeight: 1.5 }}>{note}</div>}
    </div>
  );
}

/* ── AI REASONING ── */
export function AIReasoning({ steps }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 14px', background: 'var(--primary-l)', borderRadius: 6, border: '1px solid var(--primary-m)' }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--primary2)', textTransform: 'uppercase', letterSpacing: '.08em' }}>AI Evaluation Chain</div>
        <div style={{ marginLeft: 'auto', fontSize: '.72rem', color: 'var(--muted)' }}>{steps.length} steps</div>
      </div>
      {(steps || []).map((step, i) => (
        <div key={i} className="reasoning-step">
          <div className="r-num">{i + 1}</div>
          <div className="r-txt">{step}</div>
        </div>
      ))}
    </div>
  );
}
