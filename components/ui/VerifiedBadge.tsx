import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/tokens'

type Props = {
  size?: 'sm' | 'md'
}

/**
 * VerifiedBadge — teal pill, reserved exclusively for verified identity.
 * Colors.verified (#5DCAA5) must not be reused for any other purpose.
 */
export default function VerifiedBadge({ size = 'md' }: Props) {
  const isSm = size === 'sm'
  return (
    <View style={[styles.badge, isSm && styles.badgeSm]}>
      <Text style={[styles.text, isSm && styles.textSm]}>✓ Verified</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.verified,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  text: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: 10,
  },
})
