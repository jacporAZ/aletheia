/**
 * DEV SCREEN — Remove before production / App Store submission.
 * Provides shortcuts for testing match engine features without going
 * through the full flow.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { Colors } from '../../constants/colors'
import { supabase } from '../../lib/supabase'
import { useMatches } from '../../lib/hooks/useMatches'

const TEST_PROFILES = [
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001', name: 'Sarah Chen' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000002', name: 'Emma Ruiz' },
]

type ActionState = Record<string, boolean>

export default function DevScreen() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState<ActionState>({})
  const { matches, refetch } = useMatches()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id)
    })
  }, [])

  function setActionLoading(key: string, val: boolean) {
    setLoading(prev => ({ ...prev, [key]: val }))
  }

  async function forceMatch(testProfileId: string, testName: string) {
    if (!currentUserId) return
    const key = `match_${testProfileId}`
    setActionLoading(key, true)
    try {
      const { data, error } = await supabase.rpc('dev_force_match', {
        p_user_a: currentUserId,
        p_user_b: testProfileId,
      })
      if (error) throw error
      Alert.alert('Match created', `Pending match with ${testName}.\nMatch ID: ${data}`)
      refetch()
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setActionLoading(key, false)
    }
  }

  async function unlockMessaging(matchId: string, name: string) {
    const key = `unlock_${matchId}`
    setActionLoading(key, true)
    try {
      const { error } = await supabase.rpc('dev_unlock_messaging', { p_match_id: matchId })
      if (error) throw error
      Alert.alert('Messaging unlocked', `Match with ${name} is now in messaging state.`)
      refetch()
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setActionLoading(key, false)
    }
  }

  async function resetDailyLikes() {
    if (!currentUserId) return
    setActionLoading('reset_likes', true)
    try {
      const { error } = await supabase.rpc('dev_reset_daily_likes', { p_user_id: currentUserId })
      if (error) throw error
      Alert.alert('Done', "Today's like counter has been reset.")
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setActionLoading('reset_likes', false)
    }
  }

  async function deleteAllMatches() {
    if (!currentUserId) return
    Alert.alert(
      'Delete all matches?',
      'This will remove all matches, likes, rejections, and video calls for your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('delete_all', true)
            try {
              await supabase.from('matches').delete()
                .or(`user_a.eq.${currentUserId},user_b.eq.${currentUserId}`)
              await supabase.from('likes').delete().eq('user_id', currentUserId)
              await supabase.from('rejections').delete().eq('user_id', currentUserId)
              await supabase.from('daily_like_counters').delete().eq('user_id', currentUserId)
              refetch()
              Alert.alert('Done', 'All match data cleared.')
            } catch (e: any) {
              Alert.alert('Error', e.message)
            } finally {
              setActionLoading('delete_all', false)
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Dev Tools', headerBackTitle: 'Profile' }} />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Session */}
        <Section title="Session">
          <InfoRow label="User ID" value={currentUserId ?? '—'} mono />
        </Section>

        {/* Test Profiles */}
        <Section title="Test Profiles">
          <Text style={styles.hint}>Force a mutual match with a test profile.</Text>
          {TEST_PROFILES.map(p => (
            <DevButton
              key={p.id}
              label={`Match with ${p.name}`}
              loading={!!loading[`match_${p.id}`]}
              onPress={() => forceMatch(p.id, p.name)}
            />
          ))}
        </Section>

        {/* Active Matches */}
        <Section title={`Active Matches (${matches.length})`}>
          {matches.length === 0 ? (
            <Text style={styles.hint}>No matches yet.</Text>
          ) : (
            matches.map(m => (
              <View key={m.id} style={styles.matchRow}>
                <View style={styles.matchInfo}>
                  <Text style={styles.matchName}>{m.otherProfile.name}</Text>
                  <Text style={styles.matchStatus}>{m.status}</Text>
                </View>
                {m.status !== 'messaging' && (
                  <DevButton
                    label="Unlock"
                    small
                    loading={!!loading[`unlock_${m.id}`]}
                    onPress={() => unlockMessaging(m.id, m.otherProfile.name)}
                  />
                )}
                {m.status === 'messaging' && (
                  <Text style={styles.unlockedBadge}>Unlocked</Text>
                )}
              </View>
            ))
          )}
        </Section>

        {/* Utilities */}
        <Section title="Utilities">
          <DevButton
            label="Reset daily likes"
            loading={!!loading['reset_likes']}
            onPress={resetDailyLikes}
          />
          <DevButton
            label="Delete all match data"
            destructive
            loading={!!loading['delete_all']}
            onPress={deleteAllMatches}
          />
        </Section>

        <Text style={styles.warning}>
          DEV ONLY — Remove this screen before App Store submission
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.infoValueMono]} numberOfLines={1} ellipsizeMode="middle">
        {value}
      </Text>
    </View>
  )
}

function DevButton({
  label, onPress, loading, destructive, small,
}: {
  label: string
  onPress: () => void
  loading?: boolean
  destructive?: boolean
  small?: boolean
}) {
  return (
    <TouchableOpacity
      style={[
        styles.devBtn,
        destructive && styles.devBtnDestructive,
        small && styles.devBtnSmall,
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.75}
    >
      {loading
        ? <ActivityIndicator color={Colors.white} size="small" />
        : <Text style={[styles.devBtnText, small && styles.devBtnTextSmall]}>{label}</Text>
      }
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.frost,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    gap: 16,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: Colors.haze,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.mist,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.haze,
  },
  sectionBody: {
    padding: 12,
    gap: 8,
  },
  hint: {
    fontSize: 13,
    color: Colors.mist,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.navy,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: Colors.deep,
    maxWidth: '60%',
  },
  infoValueMono: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.mist,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.navy,
  },
  matchStatus: {
    fontSize: 12,
    color: Colors.mist,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  unlockedBadge: {
    fontSize: 12,
    color: Colors.verified,
    fontWeight: '600',
  },
  devBtn: {
    backgroundColor: Colors.ocean,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  devBtnDestructive: {
    backgroundColor: '#C0392B',
  },
  devBtnSmall: {
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  devBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  devBtnTextSmall: {
    fontSize: 13,
  },
  warning: {
    fontSize: 12,
    color: Colors.mist,
    textAlign: 'center',
    marginTop: 8,
  },
})
