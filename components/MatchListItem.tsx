import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { formatDistanceToNow } from 'date-fns'
import { Colors } from '../constants/colors'
import { MatchWithProfile } from '../lib/hooks/useMatches'

const STATUS_COLORS: Record<string, string> = {
  pending:   Colors.sky,
  scheduled: Colors.ocean,
  messaging: Colors.verified,
  expired:   Colors.mist,
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pending',
  scheduled: 'Call Scheduled',
  messaging: 'Messaging',
  expired:   'Expired',
}

type Props = {
  match: MatchWithProfile
  onPress: () => void
}

export default function MatchListItem({ match, onPress }: Props) {
  const photo = match.otherProfile.photos?.[0]
  const badgeColor = STATUS_COLORS[match.status] ?? Colors.mist
  const badgeLabel = STATUS_LABELS[match.status] ?? match.status

  const showExpiry = match.status !== 'messaging'
  const expiryText = showExpiry
    ? `Expires ${formatDistanceToNow(new Date(match.expires_at), { addSuffix: true })}`
    : null

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>
            {match.otherProfile.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{match.otherProfile.name}</Text>
        {expiryText ? <Text style={styles.expiry}>{expiryText}</Text> : null}
      </View>

      <View style={[styles.badge, { backgroundColor: badgeColor + '22', borderColor: badgeColor }]}>
        <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: Colors.haze,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    backgroundColor: Colors.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.ocean,
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.navy,
  },
  expiry: {
    fontSize: 12,
    color: Colors.mist,
    marginTop: 3,
  },
  badge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginLeft: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
})
