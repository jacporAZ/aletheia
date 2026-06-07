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
import { Redirect, Stack } from 'expo-router'
import { Colors } from '../../constants/colors'
import { supabase } from '../../lib/supabase'
import { useMatches } from '../../lib/hooks/useMatches'

const TEST_PROFILES = [
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001', name: 'Sarah Chen' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000002', name: 'Emma Ruiz' },
]

type ActionState = Record<string, boolean>

// Profile ID for the test user used as the "incoming" sender in realtime checks.
const SIMULATE_SENDER_ID = TEST_PROFILES[0].id

type TestStatus = 'idle' | 'running' | 'pass' | 'fail' | 'warn'

// Each test returns a plain result object — no external test framework involved.
type TestResult = {
  passed: boolean
  warning?: boolean
  error?: string
}

type TestRowState = {
  label: string
  status: TestStatus
  error?: string
}

const TEST_KEYS = [
  'auth_session',
  'profile_exists',
  'discover_feed',
  'force_match',
  'match_pending',
  'unlock_messaging',
  'match_messaging',
  'send_message',
  'message_persisted',
  'locked_gate',
  'daily_like_reset',
] as const

type TestKey = (typeof TEST_KEYS)[number]

const TEST_LABELS: Record<TestKey, string> = {
  auth_session: 'Auth session',
  profile_exists: 'Profile exists',
  discover_feed: 'Discover feed',
  force_match: 'Force match',
  match_pending: 'Match created (pending)',
  unlock_messaging: 'Unlock messaging',
  match_messaging: 'Match in messaging state',
  send_message: 'Send message',
  message_persisted: 'Message persisted',
  locked_gate: 'Locked gate (RLS)',
  daily_like_reset: 'Daily like reset',
}

function initialResults(): Record<TestKey, TestRowState> {
  return TEST_KEYS.reduce((acc, key) => {
    acc[key] = { label: TEST_LABELS[key], status: 'idle' }
    return acc
  }, {} as Record<TestKey, TestRowState>)
}

function pass(): TestResult {
  return { passed: true }
}

function fail(error: string): TestResult {
  return { passed: false, error }
}

function warn(error: string): TestResult {
  return { passed: false, warning: true, error }
}

export default function DevScreen() {
  if (!__DEV__) {
    return <Redirect href="/(tabs)/profile" />
  }

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState<ActionState>({})
  const [results, setResults] = useState<Record<TestKey, TestRowState>>(initialResults)
  const [running, setRunning] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const { matches, refetch } = useMatches()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id)
    })
  }, [])

  function setActionLoading(key: string, val: boolean) {
    setLoading(prev => ({ ...prev, [key]: val }))
  }

  function setTestStatus(key: TestKey, status: TestStatus, error?: string) {
    setResults(prev => ({
      ...prev,
      [key]: { label: TEST_LABELS[key], status, error },
    }))
  }

  function clearResults() {
    setResults(initialResults())
  }

  // Runs all 11 integration tests sequentially against the real Supabase
  // backend. Each test can read state produced by the test before it
  // (e.g. the match ID created by `force_match`), so order matters and we
  // share scratch state through a mutable `ctx` object.
  async function runAllTests() {
    if (running) return
    setRunning(true)
    clearResults()

    const ctx: {
      userId: string | null
      matchId: string | null
      lockedMatchId: string | null
    } = { userId: currentUserId, matchId: null, lockedMatchId: null }

    const tests: { key: TestKey; run: () => Promise<TestResult> }[] = [
      {
        // 1 — a valid auth session must exist for everything else to work.
        key: 'auth_session',
        run: async () => {
          const { data, error } = await supabase.auth.getSession()
          if (error) return fail(error.message)
          if (!data.session?.user) return fail('No active session')
          ctx.userId = data.session.user.id
          return pass()
        },
      },
      {
        // 2 — the current user must have a profiles row.
        key: 'profile_exists',
        run: async () => {
          if (!ctx.userId) return fail('No user id from auth session')
          const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', ctx.userId)
            .maybeSingle()
          if (error) return fail(error.message)
          if (!data) return fail('No profile row for current user')
          return pass()
        },
      },
      {
        // 3 — mirror the Discover feed query (direct profiles-by-city query,
        // matching useDiscover.ts). Returning >= 0 rows without error passes.
        key: 'discover_feed',
        run: async () => {
          if (!ctx.userId) return fail('No user id from auth session')
          const { data: myProfile, error: profileError } = await supabase
            .from('profiles')
            .select('city')
            .eq('id', ctx.userId)
            .single()
          if (profileError) return fail(profileError.message)

          const { error } = await supabase
            .from('profiles')
            .select('id')
            .eq('city', myProfile.city)
            .neq('id', ctx.userId)
            .limit(20)
          if (error) return fail(error.message)
          return pass()
        },
      },
      {
        // 4 — force a match with the first test profile; expect a match id back.
        key: 'force_match',
        run: async () => {
          if (!ctx.userId) return fail('No user id from auth session')
          const { data, error } = await supabase.rpc('dev_force_match', {
            p_user_a: ctx.userId,
            p_user_b: TEST_PROFILES[0].id,
          })
          if (error) return fail(error.message)
          if (!data || typeof data !== 'string') return fail('No match ID returned')
          ctx.matchId = data
          return pass()
        },
      },
      {
        // 5 — newly forced match should be in `pending` state.
        key: 'match_pending',
        run: async () => {
          if (!ctx.matchId) return fail('No match ID from force match')
          const { data, error } = await supabase
            .from('matches')
            .select('status')
            .eq('id', ctx.matchId)
            .single()
          if (error) return fail(error.message)
          if (data.status !== 'pending') {
            return fail(`Expected status "pending", got "${data.status}"`)
          }
          return pass()
        },
      },
      {
        // 6 — unlocking should not error.
        key: 'unlock_messaging',
        run: async () => {
          if (!ctx.matchId) return fail('No match ID from force match')
          const { error } = await supabase.rpc('dev_unlock_messaging', {
            p_match_id: ctx.matchId,
          })
          if (error) return fail(error.message)
          return pass()
        },
      },
      {
        // 7 — after unlock the match should be in `messaging` state.
        key: 'match_messaging',
        run: async () => {
          if (!ctx.matchId) return fail('No match ID from force match')
          const { data, error } = await supabase
            .from('matches')
            .select('status')
            .eq('id', ctx.matchId)
            .single()
          if (error) return fail(error.message)
          if (data.status !== 'messaging') {
            return fail(`Expected status "messaging", got "${data.status}"`)
          }
          return pass()
        },
      },
      {
        // 8 — insert a message on the unlocked match; expect no error.
        key: 'send_message',
        run: async () => {
          if (!ctx.matchId) return fail('No match ID from force match')
          if (!ctx.userId) return fail('No user id from auth session')
          const { error } = await supabase.from('messages').insert({
            match_id: ctx.matchId,
            sender_id: ctx.userId,
            content: `Test message ${new Date().toISOString()}`,
          })
          if (error) return fail(error.message)
          return pass()
        },
      },
      {
        // 9 — read the message back to confirm it persisted.
        key: 'message_persisted',
        run: async () => {
          if (!ctx.matchId) return fail('No match ID from force match')
          const { data, error } = await supabase
            .from('messages')
            .select('id')
            .eq('match_id', ctx.matchId)
            .limit(1)
          if (error) return fail(error.message)
          if (!data || data.length === 0) return fail('No persisted message found')
          return pass()
        },
      },
      {
        // 10 — force a second (pending) match and attempt to insert a message.
        // The RLS policy should reject it. If the insert succeeds, RLS is not
        // enforced yet — surface that as a warning, not a hard fail.
        key: 'locked_gate',
        run: async () => {
          if (!ctx.userId) return fail('No user id from auth session')
          const { data: lockedId, error: matchError } = await supabase.rpc(
            'dev_force_match',
            { p_user_a: ctx.userId, p_user_b: TEST_PROFILES[1].id }
          )
          if (matchError) return fail(matchError.message)
          if (!lockedId || typeof lockedId !== 'string') {
            return fail('No match ID returned for locked match')
          }
          ctx.lockedMatchId = lockedId

          const { error } = await supabase.from('messages').insert({
            match_id: lockedId,
            sender_id: ctx.userId,
            content: `Should be blocked ${new Date().toISOString()}`,
          })
          if (error) return pass() // expected: RLS blocked the insert
          return warn('RLS not enforced — insert on pending match succeeded')
        },
      },
      {
        // 11 — reset daily likes; expect no error.
        key: 'daily_like_reset',
        run: async () => {
          if (!ctx.userId) return fail('No user id from auth session')
          const { error } = await supabase.rpc('dev_reset_daily_likes', {
            p_user_id: ctx.userId,
          })
          if (error) return fail(error.message)
          return pass()
        },
      },
    ]

    for (const test of tests) {
      setTestStatus(test.key, 'running')
      try {
        const result = await test.run()
        if (result.warning) {
          setTestStatus(test.key, 'warn', result.error)
        } else if (result.passed) {
          setTestStatus(test.key, 'pass')
        } else {
          setTestStatus(test.key, 'fail', result.error)
        }
      } catch (e: any) {
        setTestStatus(test.key, 'fail', e?.message ?? 'Unexpected error')
      }
    }

    setRunning(false)
    refetch()
  }

  // Simulates the *other* user sending a message so the realtime subscription
  // in useMessages can be verified by navigating to the chat afterwards.
  async function simulateIncomingMessage() {
    if (simulating) return
    setSimulating(true)
    try {
      const target = matches.find(m => m.status === 'messaging')
      if (!target) {
        Alert.alert(
          'No messaging match',
          'Force a match and unlock messaging first, then try again.'
        )
        return
      }
      const content = `Incoming test message ${new Date().toISOString()}`
      const { error } = await supabase.rpc('dev_simulate_message', {
        p_match_id: target.id,
        p_content: content,
        p_sender_id: SIMULATE_SENDER_ID,
      })
      if (error) throw error
      Alert.alert(
        'Message sent',
        `Inserted into chat with ${target.otherProfile.name}. Open that chat to see it arrive via realtime.`
      )
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to simulate message')
    } finally {
      setSimulating(false)
    }
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

  async function completeCall(matchId: string, name: string) {
    const key = `complete_${matchId}`
    setActionLoading(key, true)
    try {
      const { error } = await supabase.rpc('dev_complete_call', { p_match_id: matchId })
      if (error) throw error
      Alert.alert('Call completed', `Call with ${name} marked as done. Messaging is now unlocked.`)
      refetch()
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setActionLoading(key, false)
    }
  }

  async function syncTestProfiles() {
    if (!currentUserId) return
    setActionLoading('sync_profiles', true)
    try {
      const { data: myProfile, error: profileError } = await supabase
        .from('profiles')
        .select('city')
        .eq('id', currentUserId)
        .single()
      if (profileError) throw profileError

      const { error } = await supabase.rpc('dev_sync_test_profiles', { p_city: myProfile.city })
      if (error) throw error

      Alert.alert('Done', `Test profiles synced to city: ${myProfile.city}`)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setActionLoading('sync_profiles', false)
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
              const { error } = await supabase.rpc('dev_clear_match_data', { p_user_id: currentUserId })
              if (error) throw error
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
          <Text style={styles.hint}>Sync test profiles to your city so they appear in Discover, then force a match.</Text>
          <DevButton
            label="Sync test profiles to my city"
            loading={!!loading['sync_profiles']}
            onPress={syncTestProfiles}
          />
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
                {m.status === 'scheduled' && (
                  <DevButton
                    label="Complete call"
                    small
                    loading={!!loading[`complete_${m.id}`]}
                    onPress={() => completeCall(m.id, m.otherProfile.name)}
                  />
                )}
                {m.status === 'pending' && (
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

        {/* Integration Tests */}
        <Section title="Integration Tests">
          <Text style={styles.hint}>
            Runs 11 checks against the live Supabase backend in order. Some tests
            create real match and message rows on your account.
          </Text>
          <DevButton
            label={running ? 'Running tests…' : 'Run all tests'}
            loading={running}
            onPress={runAllTests}
          />
          {TEST_KEYS.map(key => (
            <TestRow key={key} row={results[key]} />
          ))}
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={clearResults}
            disabled={running}
            activeOpacity={0.6}
          >
            <Text style={styles.clearBtnText}>Clear results</Text>
          </TouchableOpacity>
        </Section>

        {/* Realtime */}
        <Section title="Realtime">
          <Text style={styles.hint}>
            Inserts a message from a test profile into your first messaging match,
            then open that chat to confirm it arrives via the realtime subscription.
          </Text>
          <DevButton
            label="Simulate incoming message"
            loading={simulating}
            onPress={simulateIncomingMessage}
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

function TestRow({ row }: { row: TestRowState }) {
  const { label, status, error } = row

  let statusText = '—'
  let statusColor = Colors.mist
  if (status === 'running') {
    statusText = '…'
    statusColor = Colors.ocean
  } else if (status === 'pass') {
    statusText = 'PASS'
    statusColor = Colors.verified
  } else if (status === 'fail') {
    statusText = 'FAIL'
    statusColor = '#C0392B'
  } else if (status === 'warn') {
    statusText = 'WARN'
    statusColor = '#E67E22'
  }

  return (
    <View style={styles.testRow}>
      <View style={styles.testRowMain}>
        <View style={styles.testRowHeader}>
          <Text style={styles.testName}>{label}</Text>
          <Text style={[styles.testStatus, { color: statusColor }]}>{statusText}</Text>
        </View>
        {!!error && (status === 'fail' || status === 'warn') && (
          <Text style={styles.testError}>{error}</Text>
        )}
      </View>
    </View>
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
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderTopColor: Colors.haze,
  },
  testRowMain: {
    flex: 1,
  },
  testRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testName: {
    fontSize: 14,
    color: Colors.navy,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  testStatus: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  testError: {
    fontSize: 12,
    color: Colors.mist,
    marginTop: 3,
  },
  clearBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 2,
  },
  clearBtnText: {
    fontSize: 13,
    color: Colors.mist,
    fontWeight: '600',
  },
})
