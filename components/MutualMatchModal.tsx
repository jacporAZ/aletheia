import { Modal, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors } from '../constants/colors'
import { Profile } from '../types'

type Props = {
  visible: boolean
  otherProfile: Profile | null
  onViewMatch: () => void
  onDismiss: () => void
}

export default function MutualMatchModal({ visible, otherProfile, onViewMatch, onDismiss }: Props) {
  if (!otherProfile) return null
  const photo = otherProfile.photos?.[0]

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoFallback]}>
              <Text style={styles.initial}>{otherProfile.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}

          <Text style={styles.heading}>It's a Match</Text>
          <Text style={styles.sub}>
            You and {otherProfile.name} both liked each other.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={onViewMatch} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>View Match</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onDismiss} activeOpacity={0.7}>
            <Text style={styles.secondaryBtnText}>Keep Discovering</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(242,248,254,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    borderWidth: 0.5,
    borderColor: Colors.haze,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    backgroundColor: Colors.ice,
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.ocean,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.ocean,
    marginBottom: 10,
  },
  sub: {
    fontSize: 16,
    color: Colors.deep,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: Colors.ocean,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.mist,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.mist,
    fontSize: 16,
    fontWeight: '500',
  },
})
