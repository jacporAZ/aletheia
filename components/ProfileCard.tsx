import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { Colors } from '../constants/colors'
import { Profile } from '../types'

const { width } = Dimensions.get('window')
const CARD_WIDTH = width - 32
const CARD_HEIGHT = CARD_WIDTH * (5 / 4)

type Props = {
  profile: Profile
  onLike: () => void
  onReject: () => void
  disabled?: boolean
}

export default function ProfileCard({ profile, onLike, onReject, disabled }: Props) {
  const photo = profile.photos?.[0]

  return (
    <View style={styles.card}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoFallback]} />
      )}

      <View style={styles.gradient} pointerEvents="none">
        {profile.is_verified && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Verified</Text>
          </View>
        )}
        <Text style={styles.name}>{profile.name}, {profile.age}</Text>
        {profile.city ? <Text style={styles.city}>{profile.city}</Text> : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.btnReject]}
          onPress={onReject}
          disabled={disabled}
          activeOpacity={0.75}
        >
          <Text style={styles.btnRejectText}>Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnLike, disabled && styles.btnDisabled]}
          onPress={onLike}
          disabled={disabled}
          activeOpacity={0.75}
        >
          <Text style={styles.btnLikeText}>Like</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.haze,
    backgroundColor: Colors.white,
    alignSelf: 'center',
  },
  photo: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: Colors.ice,
  },
  photoFallback: {
    backgroundColor: Colors.haze,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    height: 140,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.verified,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  name: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '700',
  },
  city: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.white,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnReject: {
    borderWidth: 1.5,
    borderColor: Colors.mist,
    backgroundColor: Colors.white,
  },
  btnLike: {
    backgroundColor: Colors.ocean,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnRejectText: {
    color: Colors.mist,
    fontSize: 16,
    fontWeight: '600',
  },
  btnLikeText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})
