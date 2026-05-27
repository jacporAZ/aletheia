// Aletheia Design System — Full Token Set
// Ported from design_handoff_aletheia_swipe/colors_and_type.css
// Colors live in colors.ts — this file adds spacing, radius, shadow, glass, motion.

import { Colors } from './colors'

export { Colors }

// ---------- Spacing (4pt grid) ----------
export const Space = {
  0:  0,
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
} as const

// ---------- Radius ----------
export const Radius = {
  xs:      6,
  sm:      10,   // photo tile
  md:      12,   // inputs / buttons
  lg:      16,
  xl:      24,   // cards
  '2xl':   32,
  pill:    999,
} as const

// ---------- Type scale ----------
export const FontSize = {
  12: 12,
  13: 13,
  14: 14,
  15: 15,
  16: 16,
  18: 18,
  20: 20,
  22: 22,
  24: 24,
  28: 28,
  32: 32,
  42: 42,
  48: 48,
} as const

export const LineHeight = {
  12: 16,
  13: 18,
  14: 20,
  15: 22,
  16: 24,
  18: 26,
  20: 28,
  22: 30,
  24: 32,
  28: 36,
  32: 40,
  42: 50,
  48: 52,
} as const

// ---------- Shadow (blue-tinted, very soft) ----------
// React Native uses individual shadow props or boxShadow (RN 0.76+).
// Exported as style objects for direct spread.
export const Shadow = {
  sm: {
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
  },
  lg: {
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 10,
  },
  xl: {
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.18,
    shadowRadius: 60,
    elevation: 16,
  },
  glass: {
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 12,
  },
} as const

// ---------- Glass tokens ----------
export const Glass = {
  // background colors for the translucent View layered inside BlurView
  tint:       'rgba(255,255,255,0.55)',
  tintStrong: 'rgba(255,255,255,0.72)',
  tintNavy:   'rgba(12,68,124,0.55)',
  border:     'rgba(255,255,255,0.6)',
  // inset highlight top-edge — applied as borderTopColor + borderTopWidth: 1
  highlight:  'rgba(255,255,255,0.9)',
  // BlurView props
  intensity:  70,   // ~blur(28px) on iOS
  tintMode:   'light' as const,
} as const

// ---------- Motion (Animated.spring / timing params) ----------
// Approximations of the CSS cubic-bezier curves using RN spring physics.
export const Motion = {
  // standard: cubic-bezier(0.2,0.7,0.2,1) @ 220ms
  standard: {
    tension: 180,
    friction: 20,
    useNativeDriver: true,
  },
  // celebratory: cubic-bezier(0.16,1,0.3,1) @ 420–520ms (match moment)
  celebratory: {
    tension: 120,
    friction: 14,
    useNativeDriver: true,
  },
  // fast timing for backdrop
  backdropDuration: 420,
  // tap scale feedback
  tapScale: 0.93,
} as const
