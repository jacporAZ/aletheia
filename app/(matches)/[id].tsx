import { useState, useEffect } from 'react'
import {
  View, Text, Image, ScrollView, Pressable,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Clock,
  Calendar,
  MessageCircle,
  XCircle,
  Video,
  UserPlus,
  Lock,
  CheckCircle,
} from 'lucide-react-native'
import { Colors } from '../../constants/colors'
import { Shadow, Radius, Space } from '../../constants/tokens'
import { useMatch } from '../../lib/hooks/useMatch'
import { useMatches } from '../../lib/hooks/useMatches'
import { useVouch, CanVouchResult } from '../../lib/hooks/useVouch'
import CallScheduler from '../../components/CallScheduler'

// ─── Status config ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string
  color: string
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>
}> = {
  pending:   { label: 'Awaiting call',        color: Colors.sky,      Icon: Clock },
  scheduled: { label: 'Call scheduled',       color: Colors.ocean,    Icon: Calendar },
  messaging: { label: 'Messaging unlocked',   color: Colors.verified, Icon: CheckCircle },
  expired:   { label: 'Expired',              color: Colors.mist,     Icon: XCircle },
}

// ─── Avatar background fallback palette ───────────────────────────────────
const AVATAR_COLORS = [Colors.ocean, Colors.deep, Colors.navy, Colors.sky]

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { match, loading, scheduleCall } = useMatch(id)
  const { renewMatch, refetch: refetchMatches } = useMatches()
  const { myVouches, canVouch, submitVouch } = useVouch()

  const [showScheduler, setShowScheduler] = useState(false)
  const [vouchResult, setVouchResult] = useState<CanVouchResult | null>(null)
  const [renewing, setRenewing] = useState(false)

  useEffect(() => {
    if (match?.status === 'messaging' && match.otherProfile?.id) {
      canVouch(match.otherProfile.id).then(setVouchResult)
    }
  }, [match?.status, match?.otherProfile?.id])

  async function handleRenew() {
    setRenewing(true)
    try {
      await renewMatch(id)
      await refetchMatches()
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to renew match.')
    } finally {
      setRenewing(false)
    }
  }

  function handleVouchPress() {
    if (!match) return
    Alert.alert(
      `Vouch for ${match.otherProfile.name}?`,
      'This tells your network they are genuine.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Vouch',
          onPress: async () => {
            try {
              await submitVouch(match.otherProfile.id)
              const result = await canVouch(match.otherProfile.id)
              setVouchResult(result)
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Could not submit vouch.')
            }
          },
        },
      ]
    )
  }

  if (loading || !match) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: true, headerTitle: 'Match', headerBackTitle: 'Back' }} />
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={Colors.ocean} />
        </View>
      </SafeAreaView>
    )
  }

  const { otherProfile, status, expires_at, latestCall } = match
  const photo = otherProfile.photos?.[0]
  const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const { label: statusLabel, color: statusColor, Icon: StatusIcon } = statusConfig
  const alreadyVouched = myVouches.some(v => v.vouched_user_id === otherProfile.id)
  const avatarBg = AVATAR_COLORS[otherProfile.name.charCodeAt(0) % AVATAR_COLORS.length]

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, headerTitle: otherProfile.name, headerBackTitle: 'Back' }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Hero photo ── */}
        <View style={styles.heroContainer}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.heroPhoto} />
          ) : (
            <View style={[styles.heroPhoto, styles.heroFallback, { backgroundColor: avatarBg }]}>
              <Text style={styles.heroInitial}>{otherProfile.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {/* Bottom scrim */}
          <View style={styles.heroScrim} />
        </View>

        {/* ── Identity + status ── */}
        <View style={styles.identityCard}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {otherProfile.name}{otherProfile.age ? `, ${otherProfile.age}` : ''}
            </Text>
            {otherProfile.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>

          {otherProfile.city ? (
            <Text style={styles.city}>{otherProfile.city}</Text>
          ) : null}

          {/* Status pill */}
          <View style={[styles.statusPill, { backgroundColor: statusColor + '18', borderColor: statusColor + '55' }]}>
            <StatusIcon size={12} color={statusColor} strokeWidth={2} />
            <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
          </View>

          {/* Expiry */}
          {status !== 'messaging' && status !== 'expired' && expires_at && (
            <Text style={styles.expiry}>
              Expires {formatDistanceToNow(new Date(expires_at), { addSuffix: true })}
            </Text>
          )}
        </View>

        {/* ── Bio ── */}
        {otherProfile.bio ? (
          <View style={styles.bioCard}>
            <Text style={styles.bio}>{otherProfile.bio}</Text>
          </View>
        ) : null}

        {/* ── Messaging locked info card ── */}
        {(status === 'pending' || status === 'scheduled') && (
          <View style={styles.lockedCard}>
            <View style={styles.lockedIconWrap}>
              <Lock size={20} color={Colors.ocean} strokeWidth={1.75} />
            </View>
            <View style={styles.lockedBody}>
              <Text style={styles.lockedTitle}>Messaging is locked</Text>
              <Text style={styles.lockedSub}>Complete a video call to unlock chat with {otherProfile.name}.</Text>
            </View>
          </View>
        )}

        {/* ── Call scheduled info ── */}
        {status === 'scheduled' && latestCall?.scheduled_at && (
          <View style={styles.callInfoCard}>
            <Calendar size={14} color={Colors.ocean} strokeWidth={1.75} />
            <Text style={styles.callInfoText}>
              Call on {format(new Date(latestCall.scheduled_at), "EEE d MMM 'at' h:mm a")}
            </Text>
          </View>
        )}

        {/* ── Schedule call CTA ── */}
        {(status === 'pending' || status === 'scheduled') && !showScheduler && (
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            onPress={() => setShowScheduler(true)}
          >
            <Video size={18} color={Colors.white} strokeWidth={1.75} />
            <Text style={styles.primaryBtnText}>Schedule a Call</Text>
          </Pressable>
        )}

        {showScheduler && (
          <View style={styles.schedulerWrap}>
            <CallScheduler
              onSchedule={async (date) => {
                await scheduleCall(date)
                setShowScheduler(false)
              }}
              onCancel={() => setShowScheduler(false)}
            />
          </View>
        )}

        {/* ── Message CTA ── */}
        {status === 'messaging' && (
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, styles.primaryBtnGreen, pressed && styles.btnPressed]}
            onPress={() => router.push(`/(messages)/${id}` as any)}
          >
            <MessageCircle size={18} color={Colors.white} strokeWidth={1.75} />
            <Text style={styles.primaryBtnText}>Message {otherProfile.name}</Text>
          </Pressable>
        )}

        {/* ── Renew CTA ── */}
        {status === 'expired' && (
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, (renewing || pressed) && styles.btnPressed]}
            onPress={handleRenew}
            disabled={renewing}
          >
            {renewing
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.primaryBtnText}>Renew Match</Text>
            }
          </Pressable>
        )}

        {/* ── Vouch section ── */}
        {status === 'messaging' && (
          <View style={styles.vouchCard}>
            <View style={styles.vouchHeadingRow}>
              <UserPlus size={14} color={Colors.navy} strokeWidth={2} />
              <Text style={styles.vouchHeading}>Vouch</Text>
            </View>
            {alreadyVouched ? (
              <View style={styles.vouchedRow}>
                <CheckCircle size={14} color={Colors.verified} strokeWidth={2} />
                <Text style={styles.vouchedText}>You've vouched for {otherProfile.name}</Text>
              </View>
            ) : vouchResult?.canVouch ? (
              <Pressable
                style={({ pressed }) => [styles.vouchBtn, pressed && { opacity: 0.75 }]}
                onPress={handleVouchPress}
              >
                <Text style={styles.vouchBtnText}>Vouch for {otherProfile.name}</Text>
              </Pressable>
            ) : (
              <Text style={styles.vouchReason}>{vouchResult?.reason ?? 'Checking eligibility…'}</Text>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.frost,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 48,
  },

  // ── Hero ──
  heroContainer: {
    position: 'relative',
  },
  heroPhoto: {
    width: '100%',
    height: 420,
    backgroundColor: Colors.ice,
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInitial: {
    fontSize: 120,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.25)',
  },
  heroScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    // soft gradient suggestion — solid semi-transparent
    backgroundColor: 'rgba(12,68,124,0.08)',
  },

  // ── Identity card ──
  identityCard: {
    paddingHorizontal: Space[5],
    paddingTop: Space[4] + 4,
    paddingBottom: Space[4],
    backgroundColor: Colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.haze,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.navy,
    letterSpacing: -0.26,
  },
  verifiedBadge: {
    backgroundColor: Colors.verified,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  city: {
    fontSize: 14,
    color: Colors.mist,
    marginBottom: Space[3],
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 6,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expiry: {
    fontSize: 12,
    color: Colors.mist,
    marginTop: 2,
  },

  // ── Bio ──
  bioCard: {
    marginHorizontal: Space[4],
    marginTop: Space[4],
    padding: Space[4],
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.haze,
    ...Shadow.sm,
  },
  bio: {
    fontSize: 15,
    color: Colors.deep,
    lineHeight: 22,
  },

  // ── Messaging locked card ──
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginHorizontal: Space[4],
    marginTop: Space[4],
    padding: Space[4],
    backgroundColor: Colors.ice,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.haze,
  },
  lockedIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: Colors.haze,
    flexShrink: 0,
  },
  lockedBody: {
    flex: 1,
  },
  lockedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
    marginBottom: 4,
  },
  lockedSub: {
    fontSize: 13,
    color: Colors.deep,
    lineHeight: 18,
  },

  // ── Call info ──
  callInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Space[4],
    marginTop: Space[3],
    padding: 14,
    backgroundColor: Colors.ice,
    borderRadius: Radius.sm,
    borderWidth: 0.5,
    borderColor: Colors.haze,
  },
  callInfoText: {
    fontSize: 14,
    color: Colors.deep,
  },

  // ── CTAs ──
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: Space[4],
    marginTop: Space[4],
    backgroundColor: Colors.ocean,
    borderRadius: Radius.md,
    paddingVertical: 15,
    ...Shadow.md,
  },
  primaryBtnGreen: {
    backgroundColor: Colors.verified,
  },
  btnPressed: {
    opacity: 0.75,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  schedulerWrap: {
    marginHorizontal: Space[4],
    marginTop: Space[3],
  },

  // ── Vouch ──
  vouchCard: {
    marginHorizontal: Space[4],
    marginTop: Space[4],
    padding: Space[4],
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.haze,
    ...Shadow.sm,
  },
  vouchHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Space[3],
  },
  vouchHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  vouchedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vouchedText: {
    fontSize: 14,
    color: Colors.verified,
    fontWeight: '500',
  },
  vouchBtn: {
    borderWidth: 1.5,
    borderColor: Colors.verified,
    borderRadius: Radius.sm,
    paddingVertical: 11,
    alignItems: 'center',
  },
  vouchBtnText: {
    color: Colors.verified,
    fontSize: 15,
    fontWeight: '600',
  },
  vouchReason: {
    fontSize: 13,
    color: Colors.mist,
  },
})
