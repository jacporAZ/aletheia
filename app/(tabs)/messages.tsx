import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { useMatches, MatchWithProfile } from '../../lib/hooks/useMatches'

export default function MessagesTab() {
  const router = useRouter()
  const { matches, loading } = useMatches()

  const messagingMatches = matches.filter(m => m.status === 'messaging')

  function renderItem({ item }: { item: MatchWithProfile }) {
    const photo = item.otherProfile.photos?.[0]
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/(messages)/${item.id}` as any)}
        activeOpacity={0.7}
      >
        {photo ? (
          <Image source={{ uri: photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>
              {item.otherProfile.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.rowText}>
          <Text style={styles.name}>{item.otherProfile.name}</Text>
          <Text style={styles.sub}>Tap to open</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {loading ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={Colors.ocean} />
        </View>
      ) : messagingMatches.length === 0 ? (
        <View style={styles.centre}>
          <Text style={styles.emptyText}>No conversations yet.</Text>
          <Text style={styles.emptySubText}>Complete a video call to unlock messaging.</Text>
        </View>
      ) : (
        <FlatList
          data={messagingMatches}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.ocean,
  },
  list: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: Colors.haze,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    backgroundColor: Colors.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.ocean,
  },
  rowText: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.navy,
  },
  sub: {
    fontSize: 13,
    color: Colors.mist,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: Colors.mist,
    marginLeft: 8,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.navy,
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.mist,
    textAlign: 'center',
  },
})
