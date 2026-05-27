/**
 * MatchMoment — glass overlay triggered after like / call request / vouch.
 * Three flavours: 'like' | 'call' | 'vouch'
 *
 * Animation:
 *  - Backdrop: opacity 0→1 + (simulated blur via dark tint) over 420ms
 *  - Card: scale 0.9→1 + translateY 20→0 + opacity 0→1 with celebratory spring
 *  - Icon badge: springs in at 140ms delay
 */
import { useRef, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { Heart, Video, UserPlus } from 'lucide-react-native'
import { Colors, Shadow, Motion, Radius, Space } from '../constants/tokens'
import { Profile } from '../types'

const { width } = Dimensions.get('window')
const CARD_WIDTH = Math.min(width - 40, 340)

export type ReactionType = 'like' | 'call' | 'vouch'

type Props = {
  visible: boolean
  reaction: ReactionType
  otherProfile: Profile | null
  onPrimary: () => void
  onDismiss: () => void
}

const CONFIG: Record<ReactionType, {
  title: string
  subtitle: (name: string) => string
  primaryLabel: string
  ctaColor: string
  Icon: React.ComponentType<{ size: number; color: string }>
}> = {
  like: {
    title: "It's a match",
    subtitle: (_name) => `You both said yes. Next step: a call to see if the vibe's real.`,
    primaryLabel: 'Schedule a call',
    ctaColor: Colors.ocean,
    Icon: Heart,
  },
  call: {
    title: 'Call requested',
    subtitle: (name) => `We'll let ${name} know. A call keeps it human.`,
    primaryLabel: 'Suggest times',
    ctaColor: Colors.verified,
    Icon: Video,
  },
  vouch: {
    title: 'Intro requested',
    subtitle: () => 'Your friend will see this and decide whether to introduce you.',
    primaryLabel: 'Write a note',
    ctaColor: Colors.sky,
    Icon: UserPlus,
  },
}

export default function MatchMoment({
  visible,
  reaction,
  otherProfile,
  onPrimary,
  onDismiss,
}: Props) {
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const cardScale      = useRef(new Animated.Value(0.9)).current
  const cardTranslateY = useRef(new Animated.Value(20)).current
  const cardOpacity    = useRef(new Animated.Value(0)).current
  const badgeScale     = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    if (visible) {
      // Backdrop fades in
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: Motion.backdropDuration,
        useNativeDriver: true,
      }).start()

      // Card springs in
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, ...Motion.celebratory }),
        Animated.spring(cardTranslateY, { toValue: 0, ...Motion.celebratory }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()

      // Badge springs in after 140ms delay
      setTimeout(() => {
        Animated.spring(badgeScale, { toValue: 1, ...Motion.celebratory }).start()
      }, 140)
    } else {
      // Reset for next open
      backdropOpacity.setValue(0)
      cardScale.setValue(0.9)
      cardTranslateY.setValue(20)
      cardOpacity.setValue(0)
      badgeScale.setValue(0.3)
    }
  }, [visible])

  if (!otherProfile) return null

  const config = CONFIG[reaction]
  const { Icon, ctaColor, title, subtitle, primaryLabel } = config
  const photo = otherProfile.photos?.[0]

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View style={styles.container}>
        <Animated.View
          style={[
            styles.card,
            Shadow.xl,
            {
              opacity: cardOpacity,
              transform: [
                { scale: cardScale },
                { translateY: cardTranslateY },
              ],
            },
          ]}
        >
          {/* Hero photo with gradient scrim */}
          <View style={styles.photoContainer}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoFallback]}>
                <Text style={styles.photoInitial}>{otherProfile.name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.photoScrim} />

            {/* Icon badge — springs in at 140ms */}
            <Animated.View
              style={[
                styles.badge,
                { transform: [{ scale: badgeScale }] },
              ]}
            >
              <Icon size={32} color={ctaColor} />
            </Animated.View>
          </View>

          {/* Copy + actions */}
          <View style={styles.body}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle(otherProfile.name)}</Text>

            <Pressable
              style={[styles.primaryBtn, { backgroundColor: ctaColor }]}
              onPress={onPrimary}
            >
              <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
            </Pressable>

            <Pressable style={styles.ghostBtn} onPress={onDismiss}>
              <Text style={styles.ghostBtnText}>Keep browsing</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12,68,124,0.45)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Space[5],
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: Radius['2xl'] + 4, // 36
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },

  // Photo section
  photoContainer: {
    height: 220,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.ice,
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    // gradient approximation
    backgroundColor: Colors.ocean,
  },
  photoInitial: {
    fontSize: 96,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.25)',
  },
  photoScrim: {
    ...StyleSheet.absoluteFillObject,
    // gradient scrim: transparent top → navy bottom
    backgroundColor: 'transparent',
  },

  // Icon badge
  badge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -36,
    marginLeft: -36,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 14,
  },

  // Body copy + buttons
  body: {
    padding: Space[6],
    paddingTop: Space[5] + 2,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.navy,
    letterSpacing: -0.24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.deep,
    textAlign: 'center',
    marginTop: Space[1] + 2,
    lineHeight: 20,
    marginBottom: Space[5],
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginBottom: Space[2],
    shadowColor: Colors.ocean,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  ghostBtn: {
    paddingVertical: Space[2] + 2,
  },
  ghostBtnText: {
    color: Colors.mist,
    fontSize: 14,
    fontWeight: '500',
  },
})
