import { useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { useDiscover } from '../../lib/hooks/useDiscover'
import { useLike } from '../../lib/hooks/useLike'
import ProfileCard from '../../components/ProfileCard'
import DailyCapBanner from '../../components/DailyCapBanner'
import MutualMatchModal from '../../components/MutualMatchModal'
import { Profile } from '../../types'

export default function DiscoverTab() {
  const router = useRouter()
  const { profiles, loading, error, tier, likesRemaining, fetchFeed, removeProfile } = useDiscover()
  const { submitLike, submitReject, submitting } = useLike()

  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const [matchedMatchId, setMatchedMatchId] = useState<string | null>(null)

  const topProfile = profiles[0] ?? null

  async function handleLike() {
    if (!topProfile || submitting) return
    const profile = topProfile
    removeProfile(profile.id)
    const result = await submitLike(profile.id)
    if (result.matched) {
      setMatchedProfile(profile)
      setMatchedMatchId(result.matchId)
    }
    if (profiles.length <= 1) fetchFeed()
  }

  async function handleReject() {
    if (!topProfile || submitting) return
    const profile = topProfile
    removeProfile(profile.id)
    await submitReject(profile.id)
    if (profiles.length <= 1) fetchFeed()
  }

  function handleViewMatch() {
    if (matchedMatchId) router.push(`/(matches)/${matchedMatchId}` as any)
    setMatchedProfile(null)
    setMatchedMatchId(null)
  }

  function handleDismissModal() {
    setMatchedProfile(null)
    setMatchedMatchId(null)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        {tier === 'direct' && (
          <Text style={styles.counter}>{likesRemaining} left today</Text>
        )}
      </View>

      <DailyCapBanner visible={tier === 'fof'} />

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.ocean} />
        ) : error ? (
          <Text style={styles.emptyText}>{error}</Text>
        ) : topProfile ? (
          <ProfileCard
            profile={topProfile}
            onLike={handleLike}
            onReject={handleReject}
            disabled={submitting}
          />
        ) : (
          <Text style={styles.emptyText}>No more profiles in your city today.</Text>
        )}
      </View>

      <MutualMatchModal
        visible={!!matchedProfile}
        otherProfile={matchedProfile}
        onViewMatch={handleViewMatch}
        onDismiss={handleDismissModal}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.frost,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.ocean,
  },
  counter: {
    fontSize: 14,
    color: Colors.mist,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.mist,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
})
