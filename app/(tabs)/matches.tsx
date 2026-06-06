import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Heart } from 'lucide-react-native'
import { Colors } from '../../constants/colors'
import { useMatches, MatchWithProfile } from '../../lib/hooks/useMatches'
import MatchListItem from '../../components/MatchListItem'

export default function MatchesTab() {
  const router = useRouter()
  const { matches, loading } = useMatches()

  function renderItem({ item }: { item: MatchWithProfile }) {
    return (
      <MatchListItem
        match={item}
        onPress={() => router.push(`/(matches)/${item.id}` as any)}
      />
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Heart size={20} color={Colors.ocean} strokeWidth={2} />
        <View>
          <Text style={styles.title}>Matches</Text>
          {!loading && matches.length > 0 && (
            <Text style={styles.subtitle}>{matches.length} active</Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={Colors.ocean} />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.centre}>
          <Heart size={48} color={Colors.haze} strokeWidth={1.5} />
          <Text style={styles.emptyText}>No matches yet</Text>
          <Text style={styles.emptySubText}>Start exploring in Discover.</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={m => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.navy,
    letterSpacing: -0.24,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.mist,
    marginTop: 1,
  },
  list: {
    paddingTop: 4,
    paddingBottom: 24,
  },
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
  },
})
