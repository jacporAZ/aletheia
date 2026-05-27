// Aletheia — full-screen views

function LoginScreen({ onSubmit, onSwitch }) {
  const [email, setEmail] = React.useState('hello@aletheia.app');
  const [password, setPassword] = React.useState('••••••••');
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '0 28px', background: A.frost, height: '100%',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 56 }}>
        <LogoMark size={64} />
        <div style={{ height: 16 }} />
        <Wordmark size={32} />
        <div style={{ marginTop: 14, color: A.mist, fontSize: 15, fontFamily: A.ui }}>Welcome back.</div>
      </div>
      <Input value={email} onChange={setEmail} placeholder="Email" />
      <Input value={password} onChange={setPassword} placeholder="Password" type="password" />
      <Button full onClick={onSubmit}>Sign in</Button>
      <div onClick={onSwitch} style={{
        marginTop: 22, textAlign: 'center', color: A.sky,
        fontSize: 14, fontFamily: A.ui, cursor: 'pointer',
      }}>No account yet? Create one</div>
    </div>
  );
}

function DiscoverScreen({ onLike, onPass, profile, dailyCount }) {
  return (
    <div style={{ flex: 1, padding: '0 16px 110px', background: A.frost, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ paddingTop: 60, paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Wordmark size={20} />
        <div style={{ fontSize: 12, color: A.mist, fontFamily: A.ui, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {dailyCount}/10 today
        </div>
      </div>

      {/* card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ProfilePhoto seed={profile.seed} height={520} name={profile.name} age={profile.age} verified={profile.verified} />
        <div style={{ padding: '16px 6px 0' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <Chip>{profile.city}</Chip>
            <Chip>{profile.work}</Chip>
          </div>
          <div style={{ fontSize: 14, color: A.deep, lineHeight: 1.5, fontFamily: A.ui }}>
            {profile.bio}
          </div>
        </div>
      </div>

      {/* action row */}
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', paddingTop: 18 }}>
        <RoundAction onClick={onPass} icon="x" />
        <RoundAction onClick={onLike} icon="heart" primary />
      </div>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span style={{
      background: A.ice, color: A.navy, fontSize: 12, fontWeight: 500,
      padding: '4px 10px', borderRadius: 999, fontFamily: A.ui,
    }}>{children}</span>
  );
}

function RoundAction({ onClick, icon, primary }) {
  React.useEffect(() => { window.lucide?.createIcons(); });
  return (
    <button onClick={onClick} style={{
      width: 64, height: 64, borderRadius: 999, border: 'none', cursor: 'pointer',
      background: primary ? A.ocean : '#fff',
      color: primary ? '#fff' : A.mist,
      boxShadow: primary
        ? '0 12px 28px rgba(26,107,181,0.35), inset 0 1px 0 rgba(255,255,255,0.25)'
        : '0 6px 18px rgba(12,68,124,0.10)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'transform 140ms cubic-bezier(0.2,0.7,0.2,1)',
    }}
    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
      <i data-lucide={icon} style={{ width: 26, height: 26 }}></i>
    </button>
  );
}

function MatchesScreen({ matches, onOpen }) {
  return (
    <div style={{ flex: 1, padding: '60px 0 110px', background: A.frost, height: '100%', overflow: 'auto' }}>
      <div style={{ padding: '0 24px 16px' }}>
        <h1 style={{ fontFamily: A.display, fontWeight: 600, fontSize: 32, color: A.navy, margin: 0, letterSpacing: '-0.01em' }}>Matches</h1>
        <div style={{ color: A.mist, fontSize: 14, marginTop: 4, fontFamily: A.ui }}>{matches.length} active</div>
      </div>
      <div style={{ padding: '0 16px' }}>
        {matches.map(m => (
          <div key={m.id} onClick={() => onOpen(m)} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: '#fff', border: `0.5px solid ${A.haze}`,
            padding: 14, borderRadius: 16, marginBottom: 10, cursor: 'pointer',
          }}>
            <Avatar seed={m.seed} name={m.name} size={56} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontFamily: A.display, fontWeight: 600, fontSize: 16, color: A.navy }}>{m.name}, {m.age}</div>
                {m.verified && <span style={{ width: 14, height: 14, borderRadius: 999, background: A.verified, color: '#fff', fontSize: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>}
              </div>
              <div style={{ fontSize: 13, color: A.deep, marginTop: 2, fontFamily: A.ui }}>{m.preview}</div>
              <div style={{ marginTop: 8 }}><StatusPill status={m.status} /></div>
            </div>
            <div style={{ fontSize: 11, color: A.mist, fontFamily: A.ui }}>{m.expires}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Avatar({ seed = 1, name, size = 40 }) {
  const grads = [
    'linear-gradient(135deg,#0C447C,#378ADD)',
    'linear-gradient(135deg,#185FA5,#85B7EB)',
    'linear-gradient(135deg,#1A6BB5,#B5D4F4)',
    'linear-gradient(135deg,#0C447C,#1A6BB5)',
  ];
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: grads[seed % grads.length],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'rgba(255,255,255,0.7)', fontFamily: A.display,
      fontWeight: 500, fontSize: size * 0.4, flexShrink: 0,
    }}>{name?.[0]}</div>
  );
}

function MatchDetailScreen({ match, onBack, onSchedule }) {
  React.useEffect(() => { window.lucide?.createIcons(); });
  const locked = match.status !== 'messaging';
  return (
    <div style={{ flex: 1, height: '100%', background: A.frost, overflow: 'auto', paddingBottom: 110 }}>
      <div style={{ position: 'relative' }}>
        <ProfilePhoto seed={match.seed} height={420} />
        <div onClick={onBack} style={{
          position: 'absolute', top: 56, left: 16, width: 40, height: 40, borderRadius: 999,
          background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          border: '0.5px solid rgba(255,255,255,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          color: A.navy,
        }}><i data-lucide="chevron-left" style={{ width: 20, height: 20 }}></i></div>
      </div>
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontFamily: A.display, fontWeight: 600, fontSize: 28, color: A.navy, margin: 0 }}>{match.name}, {match.age}</h1>
          {match.verified && <VerifiedBadge size="sm" />}
        </div>
        <div style={{ color: A.deep, fontSize: 14, marginTop: 4, fontFamily: A.ui }}>{match.city} · {match.work}</div>
        <div style={{ marginTop: 14 }}><StatusPill status={match.status} /></div>
        <div style={{ marginTop: 18, fontSize: 15, color: A.deep, lineHeight: 1.55, fontFamily: A.ui }}>{match.bio}</div>

        {locked && (
          <div style={{
            marginTop: 24, padding: 18, background: A.ice, borderRadius: 16,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <i data-lucide="video" style={{ width: 22, height: 22, color: A.ocean }}></i>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: A.ui, fontWeight: 600, fontSize: 14, color: A.navy }}>Messaging is locked</div>
              <div style={{ fontFamily: A.ui, fontSize: 13, color: A.deep, marginTop: 2 }}>Complete a video call to unlock chat.</div>
            </div>
          </div>
        )}
        <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
          <Button full onClick={onSchedule}>Schedule a call</Button>
        </div>
      </div>
    </div>
  );
}

function MessagesScreen({ threads, onOpen }) {
  return (
    <div style={{ flex: 1, padding: '60px 0 110px', background: A.frost, height: '100%', overflow: 'auto' }}>
      <div style={{ padding: '0 24px 16px' }}>
        <h1 style={{ fontFamily: A.display, fontWeight: 600, fontSize: 32, color: A.navy, margin: 0, letterSpacing: '-0.01em' }}>Messages</h1>
      </div>
      <div>
        {threads.map(t => (
          <div key={t.id} onClick={() => onOpen(t)} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 24px', cursor: 'pointer', borderTop: `0.5px solid ${A.haze}`,
          }}>
            <Avatar seed={t.seed} name={t.name} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontFamily: A.ui, fontWeight: 600, fontSize: 15, color: A.navy }}>{t.name}</div>
                <div style={{ fontSize: 11, color: A.mist, fontFamily: A.ui }}>{t.time}</div>
              </div>
              <div style={{ fontSize: 13, color: t.unread ? A.navy : A.mist, fontFamily: A.ui, marginTop: 2, fontWeight: t.unread ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.preview}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatScreen({ thread, onBack, onSend }) {
  const [text, setText] = React.useState('');
  React.useEffect(() => { window.lucide?.createIcons(); });
  const send = () => { if (text.trim()) { onSend(text); setText(''); } };
  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: A.frost }}>
      <div style={{
        paddingTop: 56, paddingBottom: 12, paddingLeft: 16, paddingRight: 16,
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: `0.5px solid ${A.haze}`, background: '#fff',
      }}>
        <div onClick={onBack} style={{ cursor: 'pointer', color: A.ocean, padding: 6 }}>
          <i data-lucide="chevron-left" style={{ width: 22, height: 22 }}></i>
        </div>
        <Avatar seed={thread.seed} name={thread.name} size={36} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: A.ui, fontWeight: 600, fontSize: 15, color: A.navy }}>{thread.name}</div>
          <div style={{ fontSize: 11, color: A.verified, fontFamily: A.ui }}>● Verified · Call completed</div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px' }}>
        {thread.messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start',
            marginBottom: 8,
          }}>
            <div style={{
              maxWidth: '72%', padding: '10px 14px', borderRadius: 18,
              background: m.from === 'me' ? A.ocean : '#fff',
              color: m.from === 'me' ? '#fff' : A.navy,
              fontSize: 15, fontFamily: A.ui, lineHeight: 1.4,
              border: m.from === 'me' ? 'none' : `0.5px solid ${A.haze}`,
            }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{
        display: 'flex', gap: 8, padding: '10px 12px 32px',
        background: '#fff', borderTop: `0.5px solid ${A.haze}`,
      }}>
        <input
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Message"
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 999,
            border: `0.5px solid ${A.haze}`, background: A.frost,
            fontSize: 15, color: A.navy, fontFamily: A.ui, outline: 'none',
          }}
        />
        <button onClick={send} style={{
          width: 44, height: 44, borderRadius: 999, border: 'none',
          background: A.ocean, color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><i data-lucide="arrow-up" style={{ width: 20, height: 20 }}></i></button>
      </div>
    </div>
  );
}

function VideoCallScreen({ match, onEnd }) {
  React.useEffect(() => { window.lucide?.createIcons(); });
  return (
    <div style={{
      height: '100%', background: A.navy, position: 'relative',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* their video (full bleed gradient placeholder) */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg,#0C447C 0%,#185FA5 50%,#1A6BB5 100%)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: A.display, fontWeight: 300, fontSize: 120,
          color: 'rgba(255,255,255,0.18)',
        }}>{match.name?.[0]}</div>
      </div>

      {/* PiP self */}
      <div style={{
        position: 'absolute', top: 60, right: 16, width: 92, height: 124,
        borderRadius: 14, background: 'linear-gradient(135deg,#185FA5,#85B7EB)',
        border: '1px solid rgba(255,255,255,0.3)', overflow: 'hidden',
      }} />

      {/* top label */}
      <div style={{
        position: 'absolute', top: 60, left: 16,
        padding: '8px 14px', borderRadius: 999,
        background: 'rgba(12,68,124,0.55)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        color: '#fff', fontSize: 13, fontFamily: A.ui, fontWeight: 500,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: A.verified }} />
        {match.name} · 02:14
      </div>

      {/* glass HUD */}
      <div style={{
        position: 'absolute', left: 16, right: 16, bottom: 40,
        background: 'rgba(255,255,255,0.18)',
        backdropFilter: 'blur(28px) saturate(140%)',
        WebkitBackdropFilter: 'blur(28px) saturate(140%)',
        border: '0.5px solid rgba(255,255,255,0.25)',
        borderRadius: 28, padding: 14,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        boxShadow: '0 12px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
      }}>
        {[
          { icon: 'mic', label: 'Mute' },
          { icon: 'video', label: 'Video' },
          { icon: 'rotate-ccw', label: 'Flip' },
        ].map(a => (
          <div key={a.icon} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: '#fff', fontFamily: A.ui, fontSize: 11,
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 999, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i data-lucide={a.icon} style={{ width: 22, height: 22 }}></i>
            </div>
            {a.label}
          </div>
        ))}
        <div onClick={onEnd} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          color: '#fff', fontFamily: A.ui, fontSize: 11, cursor: 'pointer',
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 999, background: '#E5484D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i data-lucide="phone-off" style={{ width: 22, height: 22 }}></i>
          </div>
          End
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ profile, onSignOut }) {
  React.useEffect(() => { window.lucide?.createIcons(); });
  return (
    <div style={{ flex: 1, height: '100%', overflow: 'auto', background: A.frost, paddingBottom: 110 }}>
      <div style={{ padding: '60px 24px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontFamily: A.display, fontWeight: 600, fontSize: 32, color: A.navy, margin: 0 }}>Profile</h1>
          <Button variant="ghost">Edit</Button>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 90, height: 112, borderRadius: 10,
              background: ['linear-gradient(135deg,#0C447C,#378ADD)', 'linear-gradient(135deg,#185FA5,#85B7EB)', 'linear-gradient(135deg,#1A6BB5,#B5D4F4)'][i],
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ fontFamily: A.display, fontWeight: 600, fontSize: 24, color: A.navy }}>{profile.name}, {profile.age}</div>
          <VerifiedBadge size="sm" />
        </div>
        <div style={{ fontSize: 14, color: A.mist, marginBottom: 12, fontFamily: A.ui }}>{profile.city}</div>
        <div style={{ fontSize: 15, color: A.deep, lineHeight: 1.55, fontFamily: A.ui }}>{profile.bio}</div>

        <div style={{ marginTop: 28, background: '#fff', borderRadius: 16, border: `0.5px solid ${A.haze}`, overflow: 'hidden' }}>
          {[
            { icon: 'shield-check', label: 'Trust & verification', detail: 'Verified' },
            { icon: 'users', label: 'Friends & vouches', detail: '4 vouches' },
            { icon: 'bell', label: 'Notifications' },
            { icon: 'settings', label: 'Settings' },
          ].map((row, i, a) => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              borderBottom: i === a.length - 1 ? 'none' : `0.5px solid ${A.haze}`,
              cursor: 'pointer',
            }}>
              <i data-lucide={row.icon} style={{ width: 20, height: 20, color: A.ocean }}></i>
              <div style={{ flex: 1, fontSize: 15, color: A.navy, fontFamily: A.ui }}>{row.label}</div>
              {row.detail && <div style={{ fontSize: 13, color: A.mist, fontFamily: A.ui }}>{row.detail}</div>}
              <i data-lucide="chevron-right" style={{ width: 16, height: 16, color: A.mist }}></i>
            </div>
          ))}
        </div>

        <div onClick={onSignOut} style={{
          marginTop: 32, textAlign: 'center', color: A.mist,
          fontSize: 14, fontFamily: A.ui, cursor: 'pointer',
        }}>Sign out</div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, DiscoverScreen, MatchesScreen, MatchDetailScreen, MessagesScreen, ChatScreen, VideoCallScreen, ProfileScreen, Avatar, Chip, RoundAction });
