import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import { formatDistanceToNow } from 'date-fns'
import {
  Clock,
  Calendar,
  MessageCircle,
  XCircle,
  ChevronRight,
} from 'lucide-react-native'
import { Colors } from '../constants/colors'
import { Shadow } from '../constants/tokens'
import { MatchWithProfile } from '../lib/hooks/useMatches'

const STATUS_COLORS: Record<string, string> = {
  pending:   Colors.sky,
  scheduled: Colors.ocean,
  messaging: Colors.verified,
  expired:   Colors.mist,
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pending',
  scheduled: 'Scheduled',
  messaging: 'Messaging',
  expired:   'Expired',
}

const STATUS_ICONS: Record<string, React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  pending:   Clock,
  scheduled: Calendar,
  messaging: MessageCircle,
  expired:   XCircle,
}

// Gradient-style avatar fallback — matches Discover screen placeholder palette
const AVATAR_COLORS = [Colors.ocean, Colors.deep, Colors.navy, Colors.sky]

type Props = {
  match: MatchWithProfile
  onPress: () => void
}

export default function MatchListItem({ match, onPress }: Props) {
  const photo      = match.otherProfile.photos?.[0]
  const badgeColor = STATUS_COLORS[match.status] ?? Colors.mist
  const badgeLabel = STATUS_LABELS[match.status] ?? match.status
  const StatusIcon = STATUS_ICONS[match.status] ?? Clock

  const showExpiry = match.status !== 'messaging' && match.status !== 'expired'
  const expiryText = showExpiry
    ? `Expires ${formatDistanceToNow(new Date(match.expires_at), { addSuffix: true })}`
    : null

  // Seed avatar background from name char code
  const avatarBg = AVATAR_COLORS[match.otherProfile.name.charCodeAt(0) % AVATAR_COLORS.length]

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      {/* Avatar */}
      {photo ? (
        <Image source={{ uri: photo }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: avatarBg }]}>
          <Text style={styles.avatarInitial}>
            {match.otherProfile.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {match.otherProfile.name}
          {match.otherProfile.age ? `, ${match.otherProfile.age}` : ''}
        </Text>
        {expiryText ? (
          <Text style={styles.expiry}>{expiryText}</Text>
        ) : match.status === 'messaging' ? (
          <Text style={styles.expiryReady}>Ready to chat</Text>
        ) : null}
      </View>

      {/* Status badge */}
      <View style={[styles.badge, { backgroundColor: badgeColor + '18', borderColor: badgeColor + '55' }]}>
        <StatusIcon size={11} color={badgeColor} strokeWidth={2} />
        <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
      </View>

      {/* Chevron */}
      <ChevronRight size={16} color={Colors.mist} strokeWidth={1.75} style={styles.chevron} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: Colors.haze,
    ...Shadow.sm,
  },
  rowPressed: {
    opacity: 0.75,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.9)',
  },
  info: {
    flex: 1,
    marginLeft: 14,
    gap: 3,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.navy,
    lineHeight: 22,
  },
  expiry: {
    fontSize: 12,
    color: Colors.mist,
    lineHeight: 16,
  },
  expiryReady: {
    fontSize: 12,
    color: Colors.verified,
    fontWeight: '500',
    lineHeight: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginLeft: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chevron: {
    marginLeft: 6,
  },
})
