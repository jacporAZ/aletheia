// Aletheia — swipe & match flow
// Hinge-style: photo-first card, scroll to reveal sections, react per section.
// Two variations exposed via the VARIANT toggle.

const SAMPLES = [
  { id: 1, seed: 0, name: 'Mira', age: 28, verified: true, city: 'Brooklyn',
    work: 'Sound designer · Pulse Radio', school: 'RISD',
    active: '2h ago', response: '92%', vouches: 4,
    why: ['Both value weekday quiet', 'Both prefer in-person', 'Loves early mornings'],
    prompts: [
      { q: 'My simple pleasure',  a: 'A bowl of soup on a Tuesday.' },
      { q: 'We\'ll get along if', a: 'You read the plaque at the museum.' },
      { q: 'Green flags',         a: 'You text when you land.' },
    ]},
  { id: 2, seed: 2, name: 'Nadia', age: 26, verified: true, city: 'Brooklyn',
    work: 'PhD, neuroscience · NYU', school: 'NYU',
    active: 'online', response: '88%', vouches: 2,
    why: ['Mutual friend: Alex', 'Both value career+family', 'Runs in the morning'],
    prompts: [
      { q: 'I\'m looking for',   a: 'Someone kind who laughs at their own jokes.' },
      { q: 'My last deep dive', a: 'How sleep consolidates memory.' },
    ]},
  { id: 3, seed: 1, name: 'Theo', age: 31, verified: false, city: 'Fort Greene',
    work: 'Architect · Field Office', school: 'Cooper Union',
    active: '1d ago', response: '74%', vouches: 1,
    why: ['Both love Brutalist buildings', 'Nearby: 1.2 mi'],
    prompts: [
      { q: 'Sunday morning',     a: 'Coffee, a long walk, no phone.' },
      { q: 'A fact about me',    a: 'I know every Brooklyn water tower by shape.' },
    ]},
  { id: 4, seed: 3, name: 'Priya', age: 29, verified: true, city: 'Williamsburg',
    work: 'Product lead · Stitch', school: 'Berkeley',
    active: '4h ago', response: '95%', vouches: 5,
    why: ['3 mutual friends', 'Both read The Economist', 'Cooks more than eats out'],
    prompts: [
      { q: 'Unreasonably excited about', a: 'A well-labelled spice rack.' },
      { q: 'My ideal first date',        a: 'A 30-minute walk. A bench. Silence is okay.' },
    ]},
];

const REACTIONS = [
  { id: 'pass',  icon: 'x',            label: 'Pass',            tint: 'rgba(12,68,124,0.55)', color: '#fff' },
  { id: 'like',  icon: 'heart',        label: 'Like',            tint: '#1A6BB5',              color: '#fff' },
  { id: 'call',  icon: 'video',        label: 'Schedule call',   tint: '#5DCAA5',              color: '#fff' },
  { id: 'vouch', icon: 'user-plus',    label: 'Ask a friend',    tint: 'rgba(255,255,255,0.65)', color: '#0C447C' },
];

// ─────────────────────────────────────────────────────────
// Photo placeholder — gradient + initial
// ─────────────────────────────────────────────────────────
function Photo({ seed, children, height = '100%' }) {
  const grads = [
    'linear-gradient(135deg,#0C447C 0%,#378ADD 55%,#85B7EB 100%)',
    'linear-gradient(150deg,#185FA5 0%,#85B7EB 70%,#EAF4FD 100%)',
    'linear-gradient(120deg,#1A6BB5 0%,#85B7EB 50%,#B5D4F4 100%)',
    'linear-gradient(160deg,#0C447C 0%,#1A6BB5 70%,#378ADD 100%)',
  ];
  const initial = children || '';
  return (
    <div style={{
      position: 'relative', width: '100%', height, overflow: 'hidden',
      background: grads[seed % grads.length],
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: A.display, fontWeight: 300, fontSize: 180,
        color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em',
      }}>{initial}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Reaction rail — the small glass button that appears next to each section
// ─────────────────────────────────────────────────────────
function ReactionRail({ onReact, compact, onDark }) {
  React.useEffect(() => { window.lucide?.createIcons(); });
  return (
    <div style={{
      display: 'flex', gap: compact ? 8 : 10,
      justifyContent: compact ? 'flex-end' : 'center',
    }}>
      {REACTIONS.map(r => (
        <button key={r.id} onClick={() => onReact?.(r.id)} style={{
          width: compact ? 38 : 52, height: compact ? 38 : 52,
          borderRadius: 999, border: 'none', cursor: 'pointer',
          background: onDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          color: onDark ? '#fff' : A.ocean,
          boxShadow: onDark
            ? '0 6px 18px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.3)'
            : '0 8px 22px rgba(12,68,124,0.14), inset 0 1px 0 rgba(255,255,255,0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 160ms cubic-bezier(0.2,0.7,0.2,1)',
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title={r.label}>
          <i data-lucide={r.icon} style={{ width: compact ? 16 : 20, height: compact ? 16 : 20 }}></i>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Why-you-matched chip
// ─────────────────────────────────────────────────────────
function WhyChip({ text }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 999,
      background: A.ice, color: A.navy,
      fontFamily: A.ui, fontSize: 12, fontWeight: 500,
      border: `0.5px solid ${A.haze}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: A.ocean }} />
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Section wrapper — used for prompts. Each section has its own react rail.
// ─────────────────────────────────────────────────────────
function Section({ title, children, onReact }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: 18,
      border: `0.5px solid ${A.haze}`,
      boxShadow: '0 2px 6px rgba(12,68,124,0.04)',
    }}>
      {title && <div style={{
        fontFamily: A.ui, fontSize: 11, fontWeight: 600,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: A.mist, marginBottom: 8,
      }}>{title}</div>}
      <div style={{ fontFamily: A.display, fontSize: 20, fontWeight: 500, color: A.navy, lineHeight: 1.25, letterSpacing: '-0.01em' }}>
        {children}
      </div>
      <div style={{ marginTop: 14 }}>
        <ReactionRail onReact={onReact} compact />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Header — sticky on scroll
// ─────────────────────────────────────────────────────────
function DiscoverHeader({ dailyCount }) {
  React.useEffect(() => { window.lucide?.createIcons(); });
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      padding: '54px 16px 10px',
      background: 'linear-gradient(180deg,rgba(242,248,254,0.96) 0%,rgba(242,248,254,0.7) 80%,rgba(242,248,254,0) 100%)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span style={{ fontFamily: A.display, fontWeight: 300, fontSize: 18, letterSpacing: '0.32em', color: A.ocean }}>ALETHEIA</span>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 999,
        background: 'rgba(255,255,255,0.6)',
        border: `0.5px solid ${A.haze}`,
        fontSize: 11, fontFamily: A.ui, color: A.deep, fontWeight: 600,
        letterSpacing: '0.04em',
      }}>
        <i data-lucide="heart" style={{ width: 12, height: 12, color: A.ocean }}></i>
        {dailyCount}/10
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Trust signals row
// ─────────────────────────────────────────────────────────
function TrustSignals({ person, onDark }) {
  React.useEffect(() => { window.lucide?.createIcons(); });
  const fg = onDark ? '#fff' : A.navy;
  const muted = onDark ? 'rgba(255,255,255,0.7)' : A.mist;
  const item = (icon, main, sub) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
      <i data-lucide={icon} style={{ width: 14, height: 14, color: onDark ? 'rgba(255,255,255,0.75)' : A.ocean, flexShrink: 0 }}></i>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: A.ui, fontSize: 12, fontWeight: 600, color: fg, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{main}</div>
        <div style={{ fontFamily: A.ui, fontSize: 10, color: muted, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500 }}>{sub}</div>
      </div>
    </div>
  );
  return (
    <div style={{
      display: 'flex', gap: 10, padding: 14,
      background: onDark ? 'rgba(255,255,255,0.12)' : '#fff',
      borderRadius: 16,
      backdropFilter: onDark ? 'blur(20px) saturate(160%)' : 'none',
      WebkitBackdropFilter: onDark ? 'blur(20px) saturate(160%)' : 'none',
      border: onDark ? '0.5px solid rgba(255,255,255,0.25)' : `0.5px solid ${A.haze}`,
      boxShadow: onDark ? '0 8px 24px rgba(0,0,0,0.18)' : '0 2px 6px rgba(12,68,124,0.04)',
    }}>
      {item('shield-check', person.verified ? 'Verified' : 'Unverified', 'identity')}
      <div style={{ width: 0.5, background: onDark ? 'rgba(255,255,255,0.2)' : A.haze }} />
      {item('users', person.vouches + ' vouches', 'friends')}
      <div style={{ width: 0.5, background: onDark ? 'rgba(255,255,255,0.2)' : A.haze }} />
      {item('activity', person.response, 'replies')}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Variant A — Classic Hinge-style scrollable profile
// ─────────────────────────────────────────────────────────
function ProfileCardA({ person, dailyCount, onReact }) {
  React.useEffect(() => { window.lucide?.createIcons(); });
  return (
    <div style={{ height: '100%', overflow: 'auto', background: A.frost, paddingBottom: 120 }}>
      <DiscoverHeader dailyCount={dailyCount} />

      {/* Hero photo */}
      <div style={{ position: 'relative', margin: '0 16px', borderRadius: 24, overflow: 'hidden', boxShadow: '0 12px 32px rgba(12,68,124,0.18)' }}>
        <div style={{ height: 480 }}><Photo seed={person.seed}>{person.name[0]}</Photo></div>

        {/* top-left: active status */}
        <div style={{
          position: 'absolute', top: 14, left: 14,
          padding: '6px 12px', borderRadius: 999,
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          fontFamily: A.ui, fontSize: 11, fontWeight: 600, color: A.navy,
          display: 'flex', alignItems: 'center', gap: 6,
          border: '0.5px solid rgba(255,255,255,0.8)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: person.active === 'online' ? A.verified : A.mist }} />
          Active {person.active}
        </div>

        {/* bottom glass bar: name + verified */}
        <div style={{
          position: 'absolute', left: 14, right: 14, bottom: 14,
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(28px) saturate(140%)',
          WebkitBackdropFilter: 'blur(28px) saturate(140%)',
          border: '0.5px solid rgba(255,255,255,0.85)',
          borderRadius: 18, padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 16px 44px rgba(12,68,124,0.2), inset 0 1px 0 rgba(255,255,255,1)',
        }}>
          <div>
            <div style={{ fontFamily: A.display, fontWeight: 600, fontSize: 22, color: '#0A0A0A', letterSpacing: '-0.01em' }}>
              {person.name}, {person.age}
            </div>
            <div style={{ fontFamily: A.ui, fontSize: 13, color: '#333', marginTop: 2 }}>{person.city}</div>
          </div>
          {person.verified && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: A.verified, color: '#fff',
              fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 6,
              fontFamily: A.ui, letterSpacing: '0.02em',
            }}>✓ Verified</span>
          )}
        </div>
      </div>

      {/* Photo reaction rail */}
      <div style={{ padding: '14px 16px 0' }}>
        <ReactionRail onReact={(r) => onReact(r, 'photo')} />
      </div>

      {/* Basics */}
      <div style={{ padding: '22px 22px 8px' }}>
        <div style={{ display: 'flex', gap: 14, color: A.deep, fontFamily: A.ui, fontSize: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i data-lucide="briefcase" style={{ width: 14, height: 14 }}></i>{person.work}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, color: A.deep, fontFamily: A.ui, fontSize: 14, marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i data-lucide="graduation-cap" style={{ width: 14, height: 14 }}></i>{person.school}
          </div>
        </div>
      </div>

      {/* Trust */}
      <div style={{ padding: '8px 16px' }}>
        <TrustSignals person={person} />
      </div>

      {/* Why you matched */}
      <div style={{ padding: '18px 22px 8px' }}>
        <div style={{ fontFamily: A.ui, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: A.mist, marginBottom: 10 }}>Why you matched</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {person.why.map(w => <WhyChip key={w} text={w} />)}
        </div>
      </div>

      {/* Prompts (sections with react rails) */}
      <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {person.prompts.map((p, i) => (
          <Section key={i} title={p.q} onReact={(r) => onReact(r, 'prompt-' + i)}>
            {p.a}
          </Section>
        ))}
      </div>

      {/* Second photo */}
      <div style={{ margin: '10px 16px', borderRadius: 24, overflow: 'hidden', height: 380, boxShadow: '0 12px 32px rgba(12,68,124,0.18)' }}>
        <Photo seed={person.seed + 1}>{person.name[0]}</Photo>
      </div>
      <div style={{ padding: '14px 16px 0' }}>
        <ReactionRail onReact={(r) => onReact(r, 'photo-2')} />
      </div>

      {/* Bottom: pass this profile */}
      <div style={{ padding: '40px 24px 0', textAlign: 'center' }}>
        <button onClick={() => onReact('pass', 'end')} style={{
          background: 'transparent', border: `0.5px solid ${A.mist}`,
          color: A.mist, fontFamily: A.ui, fontSize: 13, fontWeight: 500,
          padding: '10px 20px', borderRadius: 999, cursor: 'pointer',
        }}>Not for me — next profile</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Variant B — Full-bleed hero with glass overlays (showcase)
// ─────────────────────────────────────────────────────────
function ProfileCardB({ person, dailyCount, onReact }) {
  React.useEffect(() => { window.lucide?.createIcons(); });
  return (
    <div style={{ height: '100%', overflow: 'auto', background: A.navy, paddingBottom: 120 }}>
      {/* Hero: full-bleed photo */}
      <div style={{ position: 'relative', height: 640 }}>
        <Photo seed={person.seed}>{person.name[0]}</Photo>

        {/* Glass header */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '54px 16px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(180deg,rgba(12,68,124,0.3) 0%,rgba(12,68,124,0) 100%)',
        }}>
          <span style={{ fontFamily: A.display, fontWeight: 300, fontSize: 16, letterSpacing: '0.32em', color: 'rgba(255,255,255,0.9)' }}>ALETHEIA</span>
          <div style={{
            padding: '6px 12px', borderRadius: 999,
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '0.5px solid rgba(255,255,255,0.3)',
            fontSize: 11, color: '#fff', fontWeight: 600, letterSpacing: '0.04em',
          }}>{dailyCount}/10 today</div>
        </div>

        {/* Bottom overlay — name, meta, trust */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: '80px 20px 20px',
          background: 'linear-gradient(180deg,rgba(12,68,124,0) 0%,rgba(12,68,124,0.75) 60%,rgba(12,68,124,0.92) 100%)',
          color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
            <span style={{ fontFamily: A.display, fontWeight: 600, fontSize: 36, letterSpacing: '-0.01em' }}>{person.name}</span>
            <span style={{ fontFamily: A.display, fontWeight: 300, fontSize: 24, opacity: 0.75 }}>{person.age}</span>
            {person.verified && (
              <span style={{
                marginLeft: 4, display: 'inline-flex', alignItems: 'center',
                background: A.verified, color: '#fff',
                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
              }}>✓</span>
            )}
          </div>
          <div style={{ fontFamily: A.ui, fontSize: 14, opacity: 0.8, marginBottom: 14 }}>
            {person.work} · {person.city}
          </div>
          <TrustSignals person={person} onDark />
        </div>

        {/* Floating reaction rail on hero */}
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ReactionRail onReact={(r) => onReact(r, 'photo')} onDark />
        </div>
      </div>

      {/* Why matched banner */}
      <div style={{
        margin: '-20px 16px 0',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(28px) saturate(140%)',
        WebkitBackdropFilter: 'blur(28px) saturate(140%)',
        borderRadius: 20, padding: 18,
        boxShadow: '0 20px 50px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,1)',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ fontFamily: A.ui, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: A.mist, marginBottom: 10 }}>Why you matched</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {person.why.map(w => <WhyChip key={w} text={w} />)}
        </div>
      </div>

      {/* Prompts on navy background */}
      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {person.prompts.map((p, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            border: '0.5px solid rgba(255,255,255,0.2)',
            borderRadius: 20, padding: 18, color: '#fff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
          }}>
            <div style={{ fontFamily: A.ui, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>{p.q}</div>
            <div style={{ fontFamily: A.display, fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.25 }}>{p.a}</div>
            <div style={{ marginTop: 14 }}>
              <ReactionRail onReact={(r) => onReact(r, 'prompt-' + i)} compact onDark />
            </div>
          </div>
        ))}
      </div>

      {/* Second photo */}
      <div style={{ position: 'relative', margin: '10px 16px', borderRadius: 24, overflow: 'hidden', height: 380, boxShadow: '0 12px 32px rgba(0,0,0,0.3)' }}>
        <Photo seed={person.seed + 2}>{person.name[0]}</Photo>
        <div style={{ position: 'absolute', right: 14, bottom: 14 }}>
          <ReactionRail onReact={(r) => onReact(r, 'photo-2')} compact onDark />
        </div>
      </div>

      <div style={{ padding: '30px 24px 0', textAlign: 'center' }}>
        <button onClick={() => onReact('pass', 'end')} style={{
          background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.3)',
          color: 'rgba(255,255,255,0.9)', fontFamily: A.ui, fontSize: 13, fontWeight: 500,
          padding: '12px 24px', borderRadius: 999, cursor: 'pointer',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        }}>Not for me — next profile</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Match Moment overlay — glass card with their photo + next step
// ─────────────────────────────────────────────────────────
function MatchMoment({ person, reaction, onDismiss, onPrimary }) {
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setShown(true), 16);
    window.lucide?.createIcons();
    return () => clearTimeout(t);
  }, []);

  const config = {
    like: { title: "It's a match", sub: "You both said yes. Next step: a call to see if the vibe's real.", primary: "Schedule a call", icon: 'heart', ctaColor: A.ocean },
    call: { title: "Call requested", sub: "We'll let " + person.name + " know. A call keeps it human.", primary: "Suggest times", icon: 'video', ctaColor: A.verified },
    vouch: { title: "Intro requested", sub: "Your friend will see this and decide whether to introduce you.", primary: "Write a note", icon: 'user-plus', ctaColor: A.sky },
  }[reaction] || {};

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: shown ? 'rgba(12,68,124,0.45)' : 'rgba(12,68,124,0)',
      backdropFilter: shown ? 'blur(20px) saturate(140%)' : 'blur(0px)',
      WebkitBackdropFilter: shown ? 'blur(20px) saturate(140%)' : 'blur(0px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      transition: 'all 420ms cubic-bezier(0.16,1,0.3,1)',
    }}>
      <div style={{
        width: '100%', maxWidth: 340,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(40px) saturate(160%)',
        WebkitBackdropFilter: 'blur(40px) saturate(160%)',
        border: '0.5px solid rgba(255,255,255,0.9)',
        borderRadius: 28, overflow: 'hidden',
        boxShadow: '0 40px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,1)',
        transform: shown ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
        opacity: shown ? 1 : 0,
        transition: 'all 520ms cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Their photo */}
        <div style={{ height: 220, position: 'relative' }}>
          <Photo seed={person.seed}>{person.name[0]}</Photo>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg,rgba(12,68,124,0) 30%,rgba(12,68,124,0.35) 100%)',
          }} />
          {/* icon badge */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: shown ? 'translate(-50%,-50%) scale(1)' : 'translate(-50%,-50%) scale(0.3)',
            width: 72, height: 72, borderRadius: 999,
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 14px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: config.ctaColor,
            transition: 'transform 680ms cubic-bezier(0.16,1,0.3,1)',
            transitionDelay: '140ms',
          }}>
            <i data-lucide={config.icon} style={{ width: 32, height: 32 }}></i>
          </div>
        </div>

        {/* Copy */}
        <div style={{ padding: '22px 24px 20px', textAlign: 'center' }}>
          <div style={{ fontFamily: A.display, fontSize: 24, fontWeight: 600, color: A.navy, letterSpacing: '-0.01em' }}>
            {config.title}
          </div>
          <div style={{ fontFamily: A.ui, fontSize: 14, color: A.deep, marginTop: 6, lineHeight: 1.45, textWrap: 'pretty' }}>
            {config.sub}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
            <button onClick={onPrimary} style={{
              background: config.ctaColor, color: '#fff', border: 'none',
              padding: '14px 20px', borderRadius: 14, cursor: 'pointer',
              fontFamily: A.ui, fontSize: 15, fontWeight: 600,
              boxShadow: '0 10px 24px rgba(26,107,181,0.3)',
            }}>{config.primary}</button>
            <button onClick={onDismiss} style={{
              background: 'transparent', color: A.mist, border: 'none',
              padding: '10px', fontFamily: A.ui, fontSize: 14, fontWeight: 500,
              cursor: 'pointer',
            }}>Keep browsing</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SAMPLES, Photo, ReactionRail, Section, TrustSignals, ProfileCardA, ProfileCardB, MatchMoment, WhyChip, DiscoverHeader });
