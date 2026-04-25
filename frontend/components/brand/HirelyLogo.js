'use client';

export default function HirelyLogo({ compact = false, light = false, width = 150 }) {
  const primary = light ? '#f8fafc' : '#0f172a';
  const accent = light ? '#fbbf24' : '#2563eb';
  const flourish = light ? '#86efac' : '#16a34a';

  return (
    <svg width={width} height={compact ? 40 : 52} viewBox="0 0 220 72" role="img" aria-label="Hirely logo">
      <defs>
        <linearGradient id={`hirely-gradient-${light ? 'light' : 'dark'}-${width}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primary} />
          <stop offset="60%" stopColor={accent} />
          <stop offset="100%" stopColor={flourish} />
        </linearGradient>
      </defs>
      <text
        x="10"
        y="48"
        fill={`url(#hirely-gradient-${light ? 'light' : 'dark'}-${width})`}
        style={{ fontFamily: '"Brush Script MT","Segoe Script","Snell Roundhand",cursive', fontSize: 44, fontWeight: 600, letterSpacing: 0.5 }}
      >
        Hirely
      </text>
      <path d="M20 58 C62 66, 116 66, 178 52" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.82" />
      <circle cx="184" cy="50" r="4" fill={flourish} opacity="0.9" />
    </svg>
  );
}
