// Aletheia mobile UI kit — components
// Each component reads from CSS vars in colors_and_type.css

const A = {
  ocean: '#1A6BB5', sky: '#378ADD', mist: '#85B7EB', haze: '#B5D4F4',
  ice: '#EAF4FD', frost: '#F2F8FE', white: '#FFFFFF',
  navy: '#0C447C', deep: '#185FA5', verified: '#5DCAA5',
  display: 'Geist, Inter, -apple-system, system-ui, sans-serif',
  ui: 'Inter, -apple-system, system-ui, sans-serif',
};

// -------- Wordmark --------
function Wordmark({ size = 28, color = A.ocean }) {
  return (
    <span style={{
      fontFamily: A.display, fontWeight: 300, fontSize: size,
      letterSpacing: '0.18em', color, textTransform: 'uppercase',
    }}>ALETHEIA</span>
  );
}

// -------- Logo mark (uses transparent PNG) --------
function LogoMark({ size = 64, src = '../../assets/logo_transparent.png' }) {
  return <img src={src} style={{ width: size, height: size, display: 'block' }} alt="Aletheia" />;
}

// -------- Button --------
function Button({ children, variant = 'primary', onClick, disabled, full, style = {} }) {
  const base = {
    fontFamily: A.ui, fontWeight: 500, fontSize: 16,
    border: 'none', cursor: disabled ? 'default' : 'pointer',
    padding: '14px 22px', borderRadius: 12,
    transition: 'all 220ms cubic-bezier(0.2,0.7,0.2,1)',
    width: full ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
  };
  const variants = {
    primary: { background: A.ocean, color: '#fff' },
    secondary: { background: 'transparent', color: A.mist, border: `1px solid ${A.mist}` },
    ghost: { background: 'transparent', color: A.sky, padding: '8px 12px' },
  };
  return <button style={{ ...base, ...variants[variant], ...style }} onClick={disabled ? undefined : onClick}>{children}</button>;
}

// -------- Input --------
function Input({ value, onChange, placeholder, type = 'text', multiline }) {
  const props = {
    value, onChange: e => onChange?.(e.target.value), placeholder,
    style: {
      width: '100%', boxSizing: 'border-box',
      background: '#fff', border: `0.5px solid ${A.haze}`,
      borderRadius: 12, padding: 16, fontSize: 16, color: A.navy,
      fontFamily: A.ui, marginBottom: 12,
      ...(multiline && { height: 100, resize: 'none' }),
    },
  };
  return multiline ? <textarea {...props} /> : <input type={type} {...props} />;
}

// -------- VerifiedBadge --------
function VerifiedBadge({ size = 'sm' }) {
  const small = size === 'sm';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: A.verified, color: '#fff',
      fontSize: small ? 11 : 13, fontWeight: 600,
      padding: small ? '3px 8px' : '5px 11px',
      borderRadius: 6, fontFamily: A.ui,
    }}>✓ Verified</span>
  );
}

// -------- StatusPill (match status) --------
function StatusPill({ status }) {
  const styles = {
    pending:    { bg: A.ice, fg: A.navy, border: `0.5px solid ${A.haze}` },
    scheduled:  { bg: A.haze, fg: A.navy, border: 'none' },
    messaging:  { bg: A.ocean, fg: '#fff', border: 'none' },
    expired:    { bg: 'transparent', fg: A.mist, border: `0.5px solid ${A.mist}` },
  };
  const s = styles[status] || styles.pending;
  const labels = { pending: 'Pending', scheduled: 'Scheduled', messaging: 'Unlocked', expired: 'Expired' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: s.bg, color: s.fg, border: s.border,
      fontSize: 12, fontWeight: 600, padding: '4px 10px',
      borderRadius: 6, fontFamily: A.ui,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', opacity: 0.9 }} />
      {labels[status]}
    </span>
  );
}

// -------- ProfilePhoto (placeholder) --------
function ProfilePhoto({ seed = 1, height = 480, name, age, verified, children }) {
  // Stylized placeholder — gradient + initial. Real app uses real user photos.
  const grads = [
    'linear-gradient(135deg,#0C447C 0%,#378ADD 60%,#85B7EB 100%)',
    'linear-gradient(150deg,#185FA5 0%,#85B7EB 70%,#EAF4FD 100%)',
    'linear-gradient(120deg,#1A6BB5 0%,#85B7EB 50%,#B5D4F4 100%)',
    'linear-gradient(160deg,#0C447C 0%,#1A6BB5 70%,#378ADD 100%)',
  ];
  return (
    <div style={{
      position: 'relative', width: '100%', height,
      borderRadius: 20, overflow: 'hidden',
      background: grads[seed % grads.length],
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: A.display, fontWeight: 300, fontSize: 96,
        color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em',
      }}>{name ? name[0] : '·'}</div>
      {/* protection gradient */}
      <div style={{
        position: 'absolute', inset: '55% 0 0 0',
        background: 'linear-gradient(transparent, rgba(12,68,124,0.65))',
      }} />
      {/* glass info bar */}
      {(name || children) && (
        <div style={{
          position: 'absolute', left: 14, right: 14, bottom: 14,
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(28px) saturate(140%)',
          WebkitBackdropFilter: 'blur(28px) saturate(140%)',
          border: '0.5px solid rgba(255,255,255,0.6)',
          borderRadius: 18, padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 12px 40px rgba(12,68,124,0.18), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}>
          {name && (
            <div>
              <span style={{ fontFamily: A.display, fontWeight: 600, fontSize: 18, color: A.navy }}>{name}</span>
              {age && <span style={{ color: A.deep, fontWeight: 400, fontSize: 16 }}> · {age}</span>}
            </div>
          )}
          {verified && <VerifiedBadge size="sm" />}
          {children}
        </div>
      )}
    </div>
  );
}

// -------- TabBar --------
function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'discover', label: 'Discover', icon: 'compass' },
    { id: 'matches',  label: 'Matches',  icon: 'heart' },
    { id: 'messages', label: 'Messages', icon: 'message-circle' },
    { id: 'profile',  label: 'Profile',  icon: 'user' },
  ];
  React.useEffect(() => { window.lucide?.createIcons(); }, [active]);
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 30,
      paddingBottom: 28, paddingTop: 8,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(24px) saturate(140%)',
      WebkitBackdropFilter: 'blur(24px) saturate(140%)',
      borderTop: `0.5px solid ${A.haze}`,
      display: 'flex', justifyContent: 'space-around',
    }}>
      {tabs.map(t => (
        <div key={t.id} onClick={() => onChange(t.id)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          color: active === t.id ? A.ocean : A.mist,
          fontSize: 11, fontFamily: A.ui, fontWeight: 500,
          cursor: 'pointer', flex: 1, padding: '4px 0',
        }}>
          <i data-lucide={t.icon} style={{ width: 22, height: 22 }}></i>
          {t.label}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { A, Wordmark, LogoMark, Button, Input, VerifiedBadge, StatusPill, ProfilePhoto, TabBar });
