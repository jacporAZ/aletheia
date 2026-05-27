import { View, StyleSheet, ViewStyle } from 'react-native'
import { BlurView } from 'expo-blur'
import { Glass, Shadow } from '../../constants/tokens'

type Props = {
  children: React.ReactNode
  style?: ViewStyle
  /** Override blur intensity (default 70) */
  intensity?: number
  /** Tint overlay color (default Glass.tint) */
  tint?: string
  borderRadius?: number
  withShadow?: boolean
}

/**
 * GlassView — BlurView + translucent tint overlay + inset top highlight.
 * Maps to the design system's liquid glass tokens.
 */
export default function GlassView({
  children,
  style,
  intensity = Glass.intensity,
  tint = Glass.tint,
  borderRadius = 18,
  withShadow = false,
}: Props) {
  return (
    <BlurView
      intensity={intensity}
      tint={Glass.tintMode}
      style={[
        styles.blur,
        { borderRadius },
        withShadow && Shadow.glass,
        style,
      ]}
    >
      <View
        style={[
          styles.inner,
          { backgroundColor: tint, borderRadius, borderTopColor: Glass.highlight },
        ]}
      >
        {children}
      </View>
    </BlurView>
  )
}

const styles = StyleSheet.create({
  blur: {
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Glass.border,
  },
  inner: {
    flex: 1,
    borderTopWidth: 1,
  },
})
