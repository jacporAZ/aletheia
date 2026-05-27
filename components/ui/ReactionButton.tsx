import { useRef } from 'react'
import { Pressable, Animated, StyleSheet, ViewStyle } from 'react-native'
import { BlurView } from 'expo-blur'
import { Motion, Glass } from '../../constants/tokens'

type Props = {
  icon: React.ReactNode
  onPress?: () => void
  size?: number
  /** Use dark (navy glass) style — for overlays on photos */
  onDark?: boolean
  style?: ViewStyle
}

/**
 * ReactionButton — 52px glass circle.
 * Scales down to 0.93 on press using Animated, snaps back on release.
 */
export default function ReactionButton({
  icon,
  onPress,
  size = 52,
  onDark = false,
  style,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: Motion.tapScale,
      ...Motion.standard,
    }).start()
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      ...Motion.standard,
    }).start()
  }

  const bg = onDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.55)'
  const borderColor = onDark ? 'rgba(255,255,255,0.3)' : Glass.border

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.btn,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <BlurView
          intensity={Glass.intensity}
          tint={onDark ? 'dark' : Glass.tintMode}
          style={[
            styles.blur,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.inner,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: bg,
              },
            ]}
          >
            {icon}
          </Animated.View>
        </BlurView>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  btn: {
    overflow: 'hidden',
    borderWidth: 0.5,
    shadowColor: '#0C447C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 6,
  },
  blur: {
    overflow: 'hidden',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
