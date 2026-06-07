/**
 * Discover tab — Variant A · Cards
 * Hinge-style vertical scroll. Each profile section is a raised card
 * with a per-section reaction rail. Reactions trigger the MatchMoment overlay.
 */
import { useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { BlurView } from 'expo-blur'
import {
  X,
  Heart,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Users,
  Activity,
} from 'lucide-react-native'
import { useRouter, useFocusEffect } from 'expo-router'

import { Colors, Shadow, Radius, Space } from '../../constants/tokens'
import { useDiscover, MAX_DAILY_LIKES } from '../../lib/hooks/useDiscover'
import { useLike } from '../../lib/hooks/useLike'
import MatchMoment, { ReactionType } from '../../components/MutualMatchModal'
import { Profile } from '../../types'

// ─── Placeholder photo (gradient approximation + initial) ──────────────────
const GRAD_COLORS = [Colors.ocean, Colors.deep, Colors.navy, Colors.sky]

function PhotoPlaceholder({
  seed,
  initial,
  height,
}: {
  seed: number
  initial: string
  height: number
}) {
  const bg = GRAD_COLORS[seed % GRAD_COLORS.length]
  return (
    <View style={[styles.photoPlaceholder, { height, backgroundColor: bg }]}>
      <Text style={styles.photoInitial}>{initial}</Text>
    </View>
  )
}

// ─── Reaction rail ─────────────────────────────────────────────────────────
const REACTIONS: Array<{
  id: ReactionType | 'pass'
  Icon: React.ComponentType<{ size: number; color: string }>
  color: string
}> = [
  { id: 'pass', Icon: X,     color: Colors.mist },
  { id: 'like', Icon: Heart, color: Colors.ocean },
]

function ReactionRail({
  onReact,
  compact = false,
}: {
  onReact: (reaction: ReactionType | 'pass') => void
  compact?: boolean
}) {
  const size = compact ? 38 : 52
  const iconSize = compact ? 16 : 20

  return (
    <View style={[styles.reactionRail, compact && styles.reactionRailCompact]}>
      {REACTIONS.map(({ id, Icon, color }) => (
        <Pressable
          key={id}
          onPress={() => onReact(id)}
          style={({ pressed }) => [
            styles.reactionBtn,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ scale: pressed ? 0.93 : 1 }],
            },
          ]}
        >
          <View style={[styles.reactionInner, { borderRadius: size / 2 }]}>
            <Icon size={iconSize} color={color} />
          </View>
        </Pressable>
      ))}
    </View>
  )
}

// ─── Trust signals row ─────────────────────────────────────────────────────
function TrustSignals({
  verified,
  vouches,
  responseRate,
}: {
  verified: boolean
  vouches: number
  responseRate: string
}) {
  return (
    <View style={styles.trustCard}>
      <View style={styles.trustItem}>
        <ShieldCheck size={14} color={Colors.ocean} />
        <View>
          <Text style={styles.trustMain}>{verified ? 'Verified' : 'Unverified'}</Text>
          <Text style={styles.trustSub}>IDENTITY</Text>
        </View>
      </View>
      <View style={styles.trustDivider} />
      <View style={styles.trustItem}>
        <Users size={14} color={Colors.ocean} />
        <View>
          <Text style={styles.trustMain}>{vouches} vouches</Text>
          <Text style={styles.trustSub}>FRIENDS</Text>
        </View>
      </View>
      <View style={styles.trustDivider} />
      <View style={styles.trustItem}>
        <Activity size={14} color={Colors.ocean} />
        <View>
          <Text style={styles.trustMain}>{responseRate}</Text>
          <Text style={styles.trustSub}>REPLIES</Text>
        </View>
      </View>
    </View>
  )
}

// ─── Why-you-matched chip ──────────────────────────────────────────────────
function WhyChip({ text }: { text: string }) {
  return (
    <View style={styles.chip}>
      <View style={styles.chipDot} />
      <Text style={styles.chipText}>{text}</Text>
    </View>
  )
}

// ─── Prompt section card ───────────────────────────────────────────────────
function PromptSection({
  question,
  answer,
  onReact,
}: {
  question: string
  answer: string
  onReact: (r: ReactionType | 'pass') => void
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.eyebrow}>{question}</Text>
      <Text style={styles.promptAnswer}>{answer}</Text>
      <View style={styles.sectionRailWrap}>
        <ReactionRail onReact={onReact} compact />
      </View>
    </View>
  )
}

// ─── Sticky header ─────────────────────────────────────────────────────────
function DiscoverHeader({ likesUsed }: { likesUsed: number }) {
  return (
    <View style={styles.header}>
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.headerInner}>
        <Text style={styles.wordmark}>ALETHEIA</Text>
        <View style={styles.counterPill}>
          <Heart size={12} color={Colors.ocean} />
          <Text style={styles.counterText}>{likesUsed}/{MAX_DAILY_LIKES}</Text>
        </View>
      </View>
    </View>
  )
}

// ─── Profile scroll view ───────────────────────────────────────────────────
function ProfileView({
  profile,
  onReact,
  seed,
}: {
  profile: Profile
  onReact: (reaction: ReactionType | 'pass', anchor: string) => void
  seed: number
}) {
  const photo0 = profile.photos?.[0]
  const photo1 = profile.photos?.[1]
  const initial = profile.name.charAt(0).toUpperCase()

  // Fields not yet in DB schema — mock with graceful fallbacks
  const work         = (profile as any).work          ?? null
  const school       = (profile as any).school         ?? null
  const activeLabel  = (profile as any).active_label   ?? null
  const responseRate = (profile as any).response_rate  ?? '—'
  const vouches      = (profile as any).vouches        ?? 0
  const why: string[] = (profile as any).why           ?? []
  const prompts: Array<{ q: string; a: string }> = (profile as any).prompts ?? []

  const isOnline = activeLabel === 'online'

  return (
    <View>
      {/* ── Hero photo card ── */}
      <View style={styles.heroCard}>
        {photo0 ? (
          <Image source={{ uri: photo0 }} style={styles.heroPhoto} />
        ) : (
          <PhotoPlaceholder seed={seed} initial={initial} height={480} />
        )}

        {/* Active status pill */}
        {activeLabel && (
          <View style={styles.activePill}>
            <BlurView intensity={60} tint="light" style={styles.activePillBlur}>
              <View style={styles.activePillInner}>
                <View style={[styles.activeDot, { backgroundColor: isOnline ? Colors.verified : Colors.mist }]} />
                <Text style={styles.activePillText}>
                  {isOnline ? 'Online now' : `Active ${activeLabel}`}
                </Text>
              </View>
            </BlurView>
          </View>
        )}

        {/* Bottom glass bar: name + verified */}
        <View style={styles.heroBar}>
          <BlurView intensity={70} tint="light" style={styles.heroBarBlur}>
            <View style={styles.heroBarInner}>
              <View>
                <Text style={styles.heroName}>{profile.name}, {profile.age}</Text>
                {profile.city ? (
                  <Text style={styles.heroCity}>{profile.city}</Text>
                ) : null}
              </View>
              {profile.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              )}
            </View>
          </BlurView>
        </View>
      </View>

      {/* ── Photo reaction rail ── */}
      <View style={styles.photoRailWrap}>
        <ReactionRail onReact={(r) => onReact(r, 'photo')} />
      </View>

      {/* ── Basics row ── */}
      {(work || school) && (
        <View style={styles.basicsRow}>
          {work && (
            <View style={styles.basicsItem}>
              <Briefcase size={14} color={Colors.deep} />
              <Text style={styles.basicsText}>{work}</Text>
            </View>
          )}
          {school && (
            <View style={styles.basicsItem}>
              <GraduationCap size={14} color={Colors.deep} />
              <Text style={styles.basicsText}>{school}</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Trust signals ── */}
      <View style={styles.sectionPad}>
        <TrustSignals
          verified={profile.is_verified}
          vouches={vouches}
          responseRate={responseRate}
        />
      </View>

      {/* ── Why you matched ── */}
      {why.length > 0 && (
        <View style={styles.whySection}>
          <Text style={styles.eyebrow}>WHY YOU MATCHED</Text>
          <View style={styles.chipRow}>
            {why.map((w) => <WhyChip key={w} text={w} />)}
          </View>
        </View>
      )}

      {/* ── Prompts ── */}
      {prompts.length > 0 && (
        <View style={styles.promptsSection}>
          {prompts.map((p, i) => (
            <PromptSection
              key={i}
              question={p.q}
              answer={p.a}
              onReact={(r) => onReact(r, `prompt-${i}`)}
            />
          ))}
        </View>
      )}

      {/* ── Second photo ── */}
      <View style={styles.secondPhotoCard}>
        {photo1 ? (
          <Image source={{ uri: photo1 }} style={styles.secondPhoto} />
        ) : (
          <PhotoPlaceholder seed={seed + 1} initial={initial} height={380} />
        )}
      </View>
      <View style={styles.photoRailWrap}>
        <ReactionRail onReact={(r) => onReact(r, 'photo-2')} />
      </View>

      {/* ── Footer pass button ── */}
      <View style={styles.footerWrap}>
        <Pressable
          style={({ pressed }) => [styles.footerBtn, pressed && styles.footerBtnPressed]}
          onPress={() => onReact('pass', 'end')}
        >
          <Text style={styles.footerBtnText}>Not for me — next profile</Text>
        </Pressable>
      </View>
    </View>
  )
}

// ─── Main screen ───────────────────────────────────────────────────────────
export default function DiscoverTab() {
  const router = useRouter()
  const { profiles, loading, error, tier, likesRemaining, fetchFeed, removeProfile } = useDiscover()
  const { submitLike, submitReject, submitting } = useLike()

  const [matchMomentVisible, setMatchMomentVisible] = useState(false)
  const [matchReaction, setMatchReaction] = useState<ReactionType>('like')
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const [matchedMatchId, setMatchedMatchId] = useState<string | null>(null)

  useFocusEffect(useCallback(() => { fetchFeed() }, [fetchFeed]))

  const likesUsed = MAX_DAILY_LIKES - likesRemaining
  const topProfile = profiles[0] ?? null

  const handleReact = useCallback(async (
    reaction: ReactionType | 'pass',
    _anchor: string,
  ) => {
    if (!topProfile || submitting) return

    const profile = topProfile

    if (reaction === 'pass') {
      removeProfile(profile.id)
      await submitReject(profile.id)
      if (profiles.length <= 1) fetchFeed()
      return
    }

    removeProfile(profile.id)

    const result = await submitLike(profile.id)
    if (result.matchId) setMatchedMatchId(result.matchId)

    setMatchedProfile(profile)
    setMatchReaction('like')
    setMatchMomentVisible(true)
  }, [topProfile, submitting, profiles, removeProfile, submitLike, submitReject, fetchFeed])

  function handleMatchMomentPrimary() {
    setMatchMomentVisible(false)
    if (matchedMatchId) {
      router.push(`/(matches)/${matchedMatchId}` as any)
    }
    setMatchedMatchId(null)
    if (profiles.length <= 1) fetchFeed()
  }

  function handleMatchMomentDismiss() {
    setMatchMomentVisible(false)
    setMatchedProfile(null)
    setMatchedMatchId(null)
    if (profiles.length <= 1) fetchFeed()
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
      >
        {/* Sticky header — index 0 so stickyHeaderIndices works */}
        <DiscoverHeader likesUsed={likesUsed} />

        {/* Body */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.ocean} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : tier === 'fof' ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              You've reached your daily limit.{'\n'}Come back tomorrow.
            </Text>
          </View>
        ) : topProfile ? (
          <ProfileView
            profile={topProfile}
            onReact={handleReact}
            seed={profiles.indexOf(topProfile)}
          />
        ) : (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No more profiles in your area today.</Text>
          </View>
        )}
      </ScrollView>

      <MatchMoment
        visible={matchMomentVisible}
        reaction={matchReaction}
        otherProfile={matchedProfile}
        onPrimary={handleMatchMomentPrimary}
        onDismiss={handleMatchMomentDismiss}
      />
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.frost,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // ── Header ──
  header: {
    paddingTop: 54,
    paddingBottom: 10,
    overflow: 'hidden',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space[4],
  },
  wordmark: {
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 0.32 * 18,
    color: Colors.ocean,
  },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 0.5,
    borderColor: Colors.haze,
  },
  counterText: {
    fontSize: 11,
    color: Colors.deep,
    fontWeight: '600',
    letterSpacing: 0.04 * 11,
  },

  // ── Hero card ──
  heroCard: {
    marginHorizontal: Space[4],
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  heroPhoto: {
    width: '100%',
    height: 480,
  },
  photoPlaceholder: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: {
    fontSize: 160,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.25)',
  },

  // Active pill
  activePill: {
    position: 'absolute',
    top: 14,
    left: 14,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  activePillBlur: {
    borderRadius: Radius.pill,
  },
  activePillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.navy,
  },

  // Bottom name bar
  heroBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.85)',
    ...Shadow.glass,
  },
  heroBarBlur: {
    borderRadius: 18,
  },
  heroBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space[4],
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.9)',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0A0A0A',
    letterSpacing: -0.22,
  },
  heroCity: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: Colors.verified,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Reaction rail ──
  photoRailWrap: {
    paddingHorizontal: Space[4],
    paddingTop: 14,
  },
  reactionRail: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  reactionRailCompact: {
    justifyContent: 'flex-end',
    gap: 8,
  },
  reactionBtn: {
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.6)',
    ...Shadow.sm,
  },
  reactionInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },

  // ── Basics ──
  basicsRow: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 8,
    gap: 6,
  },
  basicsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  basicsText: {
    fontSize: 14,
    color: Colors.deep,
  },

  // ── Trust signals ──
  sectionPad: {
    paddingHorizontal: Space[4],
    paddingVertical: 8,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 14,
    gap: 10,
    borderWidth: 0.5,
    borderColor: Colors.haze,
    ...Shadow.sm,
  },
  trustItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  trustDivider: {
    width: 0.5,
    height: 32,
    backgroundColor: Colors.haze,
  },
  trustMain: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.navy,
    lineHeight: 16,
  },
  trustSub: {
    fontSize: 10,
    color: Colors.mist,
    letterSpacing: 0.04 * 10,
    fontWeight: '500',
  },

  // ── Why you matched ──
  whySection: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1 * 11,
    textTransform: 'uppercase',
    color: Colors.mist,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.ice,
    borderWidth: 0.5,
    borderColor: Colors.haze,
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.ocean,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.navy,
  },

  // ── Prompt sections ──
  promptsSection: {
    paddingHorizontal: Space[4],
    paddingTop: 18,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 0.5,
    borderColor: Colors.haze,
    ...Shadow.sm,
  },
  promptAnswer: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.navy,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  sectionRailWrap: {
    marginTop: 14,
  },

  // ── Second photo ──
  secondPhotoCard: {
    marginHorizontal: Space[4],
    marginTop: 10,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    height: 380,
    ...Shadow.lg,
  },
  secondPhoto: {
    width: '100%',
    height: 380,
  },

  // ── Footer ──
  footerWrap: {
    paddingTop: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 0.5,
    borderColor: Colors.mist,
  },
  footerBtnPressed: {
    opacity: 0.6,
  },
  footerBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.mist,
  },

  // ── States ──
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.mist,
    textAlign: 'center',
    lineHeight: 24,
  },
})
