import { useState, useEffect } from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { format, formatDistanceToNow } from 'date-fns'
import { Colors } from '../../constants/colors'
import { useMatch } from '../../lib/hooks/useMatch'
import { useMatches } from '../../lib/hooks/useMatches'
import { useVouch, CanVouchResult } from '../../lib/hooks/useVouch'
import CallScheduler from '../../components/CallScheduler'

const STATUS_COLORS: Record<string, string> = {
  pending:   Colors.sky,
  scheduled: Colors.ocean,
  messaging: Colors.verified,
  expired:   Colors.mist,
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'Awaiting call',
  scheduled: 'Call scheduled',
  messaging: 'Messaging unlocked',
  expired:   'Expired',
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { match, loading, scheduleCall, completeCall } = useMatch(id)
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
  const badgeColor = STATUS_COLORS[status] ?? Colors.mist
  const badgeLabel = STATUS_LABELS[status] ?? status

  const alreadyVouched = myVouches.some(v => v.vouched_user_id === otherProfile.id)

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, headerTitle: otherProfile.name, headerBackTitle: 'Back' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoFallback]}>
            <Text style={styles.initial}>{otherProfile.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name}>{otherProfile.name}, {otherProfile.age}</Text>
          {otherProfile.city ? <Text style={styles.city}>{otherProfile.city}</Text> : null}
          {otherProfile.bio ? <Text style={styles.bio}>{otherProfile.bio}</Text> : null}
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.badge, { backgroundColor: badgeColor + '22', borderColor: badgeColor }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
          </View>
          {status !== 'messaging' && expires_at && (
            <Text style={styles.expiry}>
              Expires {formatDistanceToNow(new Date(expires_at), { addSuffix: true })}
            </Text>
          )}
        </View>

        {status === 'scheduled' && latestCall?.scheduled_at && (
          <View style={styles.callInfo}>
            <Text style={styles.callInfoText}>
              Call scheduled for {format(new Date(latestCall.scheduled_at), "EEE d MMM 'at' h:mm a")}
            </Text>
          </View>
        )}

        {(status === 'pending' || status === 'scheduled') && !showScheduler && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setShowScheduler(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Schedule a Call</Text>
          </TouchableOpacity>
        )}

        {showScheduler && (
          <CallScheduler
            onSchedule={async (date) => {
              await scheduleCall(date)
              setShowScheduler(false)
            }}
            onCancel={() => setShowScheduler(false)}
          />
        )}

        {status === 'messaging' && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push(`/(messages)/${id}` as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Message {otherProfile.name}</Text>
          </TouchableOpacity>
        )}

        {status === 'expired' && (
          <TouchableOpacity
            style={[styles.primaryBtn, renewing && styles.btnDisabled]}
            onPress={handleRenew}
            disabled={renewing}
            activeOpacity={0.8}
          >
            {renewing
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.primaryBtnText}>Renew Match</Text>
            }
          </TouchableOpacity>
        )}

        {status === 'messaging' && (
          <View style={styles.vouchSection}>
            <Text style={styles.vouchHeading}>Vouch</Text>
            {alreadyVouched ? (
              <Text style={styles.vouchedText}>You've vouched for {otherProfile.name}</Text>
            ) : vouchResult?.canVouch ? (
              <TouchableOpacity style={styles.vouchBtn} onPress={handleVouchPress} activeOpacity={0.8}>
                <Text style={styles.vouchBtnText}>Vouch for {otherProfile.name}</Text>
              </TouchableOpacity>
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
  photo: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: Colors.ice,
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 64,
    fontWeight: '700',
    color: Colors.ocean,
  },
  info: {
    padding: 20,
    paddingBottom: 12,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.navy,
  },
  city: {
    fontSize: 15,
    color: Colors.mist,
    marginTop: 4,
  },
  bio: {
    fontSize: 15,
    color: Colors.deep,
    marginTop: 10,
    lineHeight: 22,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  badge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  expiry: {
    fontSize: 13,
    color: Colors.mist,
  },
  callInfo: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    backgroundColor: Colors.ice,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.haze,
  },
  callInfoText: {
    fontSize: 14,
    color: Colors.deep,
  },
  primaryBtn: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.ocean,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  vouchSection: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.haze,
  },
  vouchHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.navy,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vouchBtn: {
    borderWidth: 1.5,
    borderColor: Colors.verified,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  vouchBtnText: {
    color: Colors.verified,
    fontSize: 15,
    fontWeight: '600',
  },
  vouchedText: {
    fontSize: 14,
    color: Colors.verified,
    fontWeight: '500',
  },
  vouchReason: {
    fontSize: 13,
    color: Colors.mist,
  },
})
