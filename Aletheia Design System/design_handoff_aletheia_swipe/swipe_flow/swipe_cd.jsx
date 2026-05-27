// Additional Variant A-style profile cards — all light, section-based, scrollable
// ProfileCardC — Editorial: magazine-style, large serif wordmarks, generous whitespace
// ProfileCardD — Timeline: photos interleaved with prompts in a single vertical rhythm

// ─────────────────────────────────────────────────────────
// Variant C — Editorial: magazine-like, hero+pull-quote style prompts
// ─────────────────────────────────────────────────────────
function ProfileCardC({ person, dailyCount, onReact }) {
  React.useEffect(() => { window.lucide?.createIcons(); });
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#fff', paddingBottom: 120 }}>
      <DiscoverHeader dailyCount={dailyCount} />

      {/* Hero — taller, edge-to-edge, name below */}
      <div style={{ position: 'relative', height: 420, margin: '0 16px', borderRadius: 24, overflow: 'hidden', boxShadow: '0 16px 40px rgba(12,68,124,0.18)' }}>
        <Photo seed={person.seed}>{person.name[0]}</Photo>
        <div style={{
          position: 'absolute', top: 14, left: 14,
          padding: '6px 12px', borderRadius: 999,
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          fontFamily: A.ui, fontSize: 11, fontWeight: 600, color: A.navy,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: person.active === 'online' ? A.verified : A.mist }} />
          Active {person.active}
        </div>
      </div>

      {/* Large name block — editorial */}
      <div style={{ padding: '24px 24px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ fontFamily: A.display, fontWeight: 600, fontSize: 36, color: A.navy, letterSpacing: '-0.015em', lineHeight: 1.05 }}>{person.name}</div>
            <div style={{ fontFamily: A.display, fontWeight: 300, fontSize: 22, color: A.mist, marginTop: 2 }}>{person.age} · {person.city}</div>
          </div>
          {person.verified && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: A.verified, color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 6, fontFamily: A.ui }}>✓ Verified</span>
          )}
        </div>
        <div style={{ marginTop: 10, fontFamily: A.ui, fontSize: 14, color: A.deep, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i data-lucide="briefcase" style={{ width: 14, height: 14, color: A.mist }}></i>{person.work}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i data-lucide="graduation-cap" style={{ width: 14, height: 14, color: A.mist }}></i>{person.school}
          </span>
        </div>
      </div>

      {/* Photo-level reactions */}
      <div style={{ padding: '18px 16px 8px' }}>
        <ReactionRail onReact={(r) => onReact(r, 'photo')} />
      </div>

      {/* Trust */}
      <div style={{ padding: '8px 16px' }}>
        <TrustSignals person={person} />
      </div>

      {/* Why matched */}
      <div style={{ padding: '22px 22px 8px' }}>
        <div style={{ fontFamily: A.ui, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: A.mist, marginBottom: 10 }}>Why you matched</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {person.why.map(w => <WhyChip key={w} text={w} />)}
        </div>
      </div>

      {/* Prompts as pull-quotes — no card, just big type + rule */}
      <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 30 }}>
        {person.prompts.map((p, i) => (
          <div key={i}>
            <div style={{ fontFamily: A.ui, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: A.mist, marginBottom: 10 }}>{p.q}</div>
            <div style={{ fontFamily: A.display, fontSize: 26, fontWeight: 500, color: A.navy, lineHeight: 1.2, letterSpacing: '-0.01em', textWrap: 'pretty' }}>
              {'\u201C'}{p.a}{'\u201D'}
            </div>
            <div style={{ height: 1, background: A.haze, margin: '18px 0 14px', width: 40 }} />
            <ReactionRail onReact={(r) => onReact(r, 'prompt-' + i)} compact />
          </div>
        ))}
      </div>

      {/* Second photo */}
      <div style={{ margin: '20px 16px 0', borderRadius: 24, overflow: 'hidden', height: 380, boxShadow: '0 12px 32px rgba(12,68,124,0.18)' }}>
        <Photo seed={person.seed + 1}>{person.name[0]}</Photo>
      </div>
      <div style={{ padding: '14px 16px 0' }}>
        <ReactionRail onReact={(r) => onReact(r, 'photo-2')} />
      </div>

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
// Variant D — Timeline: photos and prompts interleaved in one vertical flow
// ─────────────────────────────────────────────────────────
function ProfileCardD({ person, dailyCount, onReact }) {
  React.useEffect(() => { window.lucide?.createIcons(); });
  // interleave: [photo0, prompt0, photo1, prompt1, prompt2]
  const items = [];
  items.push({ type: 'photo', seed: person.seed, key: 'p0' });
  person.prompts.forEach((p, i) => {
    items.push({ type: 'prompt', prompt: p, idx: i, key: 'q' + i });
    if (i === 0) items.push({ type: 'photo', seed: person.seed + 1, key: 'p1' });
  });

  return (
    <div style={{ height: '100%', overflow: 'auto', background: A.frost, paddingBottom: 120 }}>
      <DiscoverHeader dailyCount={dailyCount} />

      {/* Compact header card */}
      <div style={{ margin: '0 16px', padding: 18, background: '#fff', borderRadius: 20, border: `0.5px solid ${A.haze}`, boxShadow: '0 2px 6px rgba(12,68,124,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, overflow: 'hidden', flexShrink: 0 }}>
            <Photo seed={person.seed}>{person.name[0]}</Photo>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: A.display, fontWeight: 600, fontSize: 20, color: A.navy, letterSpacing: '-0.01em' }}>{person.name}, {person.age}</span>
              {person.verified && <span style={{ width: 16, height: 16, borderRadius: 999, background: A.verified, color: '#fff', fontSize: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✓</span>}
            </div>
            <div style={{ fontFamily: A.ui, fontSize: 13, color: A.deep, marginTop: 2 }}>{person.work}</div>
            <div style={{ fontFamily: A.ui, fontSize: 12, color: A.mist, marginTop: 2 }}>{person.city} · Active {person.active}</div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <TrustSignals person={person} />
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {person.why.map(w => <WhyChip key={w} text={w} />)}
        </div>
      </div>

      {/* Interleaved timeline */}
      <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map((it, i) => {
          if (it.type === 'photo') {
            return (
              <div key={it.key} style={{ position: 'relative' }}>
                <div style={{ borderRadius: 22, overflow: 'hidden', height: 340, boxShadow: '0 10px 28px rgba(12,68,124,0.14)' }}>
                  <Photo seed={it.seed}>{person.name[0]}</Photo>
                </div>
                <div style={{ position: 'absolute', right: 14, bottom: 14 }}>
                  <ReactionRail onReact={(r) => onReact(r, 'photo-' + i)} compact onDark />
                </div>
              </div>
            );
          }
          return (
            <Section key={it.key} title={it.prompt.q} onReact={(r) => onReact(r, 'prompt-' + it.idx)}>
              {it.prompt.a}
            </Section>
          );
        })}
      </div>

      <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <button onClick={() => onReact('pass', 'end')} style={{
          background: 'transparent', border: `0.5px solid ${A.mist}`,
          color: A.mist, fontFamily: A.ui, fontSize: 13, fontWeight: 500,
          padding: '10px 20px', borderRadius: 999, cursor: 'pointer',
        }}>Not for me — next profile</button>
      </div>
    </div>
  );
}

Object.assign(window, { ProfileCardC, ProfileCardD });
