import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, Pressable, Image,
  ActivityIndicator, StyleSheet, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { Heart, X } from 'lucide-react-native'
import { formatDistanceToNow } from 'date-fns'
import { Colors } from '../../constants/colors'
import { Shadow, Radius, Space } from '../../constants/tokens'
import { useMatches, MatchWithProfile } from '../../lib/hooks/useMatches'
import { usePotentialMatches, PotentialMatch } from '../../lib/hooks/usePotentialMatches'
import MatchListItem from '../../components/MatchListItem'

type Tab = 'potential' | 'matches'

const AVATAR_COLORS = [Colors.ocean, Colors.deep, Colors.navy, Colors.sky]

function avatarBg(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function PotentialCard({
  item,
  onLike,
  onReject,
}: {
  item: PotentialMatch
  onLike: () => void
  onReject: () => void
}) {
  const photo = item.profile.photos?.[0]
  const bg = avatarBg(item.profile.name)

  return (
    <View style={styles.potentialCard}>
      <View style={styles.potentialLeft}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.potentialAvatar} />
        ) : (
          <View style={[styles.potentialAvatar, styles.potentialAvatarFallback, { backgroundColor: bg }]}>
            <Text style={styles.potentialInitial}>
              {item.profile.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.potentialInfo}>
          <Text style={styles.potentialName} numberOfLines={1}>
            {item.profile.name}{item.profile.age ? `, ${item.profile.age}` : ''}
          </Text>
          {item.profile.city ? (
            <Text style={styles.potentialCity} numberOfLines={1}>{item.profile.city}</Text>
          ) : null}
          <Text style={styles.potentialTime}>
            Liked you {formatDistanceToNow(new Date(item.likedAt), { addSuffix: true })}
          </Text>
        </View>
      </View>

      <View style={styles.potentialActions}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionReject, pressed && { opacity: 0.7 }]}
          onPress={onReject}
          hitSlop={8}
        >
          <X size={18} color={Colors.mist} strokeWidth={2.5} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionLike, pressed && { opacity: 0.7 }]}
          onPress={onLike}
          hitSlop={8}
        >
          <Heart size={18} color={Colors.white} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  )
}

export default function MatchesTab() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('potential')

  const { matches, loading: matchesLoading, refetch: refetchMatches } = useMatches()
  const { potentials, loading: potentialsLoading, fetchPotentials, likeBack, dismiss } = usePotentialMatches()

  useFocusEffect(useCallback(() => {
    fetchPotentials()
    refetchMatches()
  }, [fetchPotentials, refetchMatches]))

  async function handleLikeBack(item: PotentialMatch) {
    try {
      const { matchId } = await likeBack(item.userId)
      if (matchId) {
        await refetchMatches()
        Alert.alert(
          "It's a Match!",
          `You and ${item.profile.name} liked each other. Schedule a call to get started.`,
          [
            { text: 'View Match', onPress: () => router.push(`/(matches)/${matchId}` as any) },
            { text: 'Later', style: 'cancel' },
          ]
        )
      }
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  async function handleDismiss(item: PotentialMatch) {
    try {
      await dismiss(item.userId)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  const loading = activeTab === 'potential' ? potentialsLoading : matchesLoading

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
      </View>

      {/* Segmented control */}
      <View style={styles.segmentWrap}>
        <View style={styles.segment}>
          <Pressable
            style={[styles.segmentBtn, activeTab === 'potential' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('potential')}
          >
            <Text style={[styles.segmentLabel, activeTab === 'potential' && styles.segmentLabelActive]}>
              Potential
            </Text>
            {potentials.length > 0 && (
              <View style={[styles.pill, activeTab === 'potential' && styles.pillActive]}>
                <Text style={[styles.pillText, activeTab === 'potential' && styles.pillTextActive]}>
                  {potentials.length}
                </Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, activeTab === 'matches' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('matches')}
          >
            <Text style={[styles.segmentLabel, activeTab === 'matches' && styles.segmentLabelActive]}>
              Matches
            </Text>
            {matches.length > 0 && (
              <View style={[styles.pill, activeTab === 'matches' && styles.pillActive]}>
                <Text style={[styles.pillText, activeTab === 'matches' && styles.pillTextActive]}>
                  {matches.length}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={Colors.ocean} />
        </View>
      ) : activeTab === 'potential' ? (
        potentials.length === 0 ? (
          <View style={styles.centre}>
            <Heart size={48} color={Colors.haze} strokeWidth={1.5} />
            <Text style={styles.emptyText}>No one yet</Text>
            <Text style={styles.emptySubText}>When someone likes you, they'll appear here.</Text>
          </View>
        ) : (
          <FlatList
            data={potentials}
            keyExtractor={p => p.userId}
            renderItem={({ item }) => (
              <PotentialCard
                item={item}
                onLike={() => handleLikeBack(item)}
                onReject={() => handleDismiss(item)}
              />
            )}
            contentContainerStyle={styles.list}
          />
        )
      ) : (
        matches.length === 0 ? (
          <View style={styles.centre}>
            <Heart size={48} color={Colors.haze} strokeWidth={1.5} />
            <Text style={styles.emptyText}>No matches yet</Text>
            <Text style={styles.emptySubText}>Like someone back to create a match.</Text>
          </View>
        ) : (
          <FlatList
            data={matches}
            keyExtractor={m => m.id}
            renderItem={({ item }: { item: MatchWithProfile }) => (
              <MatchListItem
                match={item}
                onPress={() => router.push(`/(matches)/${item.id}` as any)}
              />
            )}
            contentContainerStyle={styles.list}
          />
        )
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.frost,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.navy,
    letterSpacing: -0.24,
  },

  // ── Segmented control ──
  segmentWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.ice,
    borderRadius: Radius.pill,
    padding: 3,
    borderWidth: 0.5,
    borderColor: Colors.haze,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  segmentBtnActive: {
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.mist,
  },
  segmentLabelActive: {
    color: Colors.navy,
    fontWeight: '600',
  },
  pill: {
    backgroundColor: Colors.haze,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  pillActive: {
    backgroundColor: Colors.ocean,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  pillTextActive: {
    color: Colors.white,
  },

  // ── List ──
  list: {
    paddingTop: 4,
    paddingBottom: 32,
  },

  // ── Empty state ──
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.navy,
    marginTop: 4,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.mist,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // ── Potential match card ──
  potentialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 0.5,
    borderColor: Colors.haze,
    ...Shadow.sm,
  },
  potentialLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  potentialAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  potentialAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  potentialInitial: {
    fontSize: 22,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.9)',
  },
  potentialInfo: {
    flex: 1,
    gap: 2,
  },
  potentialName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.navy,
  },
  potentialCity: {
    fontSize: 13,
    color: Colors.deep,
  },
  potentialTime: {
    fontSize: 12,
    color: Colors.mist,
    marginTop: 2,
  },
  potentialActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 10,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionReject: {
    backgroundColor: Colors.frost,
    borderWidth: 1,
    borderColor: Colors.haze,
  },
  actionLike: {
    backgroundColor: Colors.ocean,
  },
})
