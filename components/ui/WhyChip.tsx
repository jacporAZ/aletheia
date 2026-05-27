import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/tokens'

type Props = {
  text: string
}

/**
 * WhyChip — ice-background pill with ocean dot prefix.
 * Used in "Why you matched" row on the Discover screen.
 */
export default function WhyChip({ text }: Props) {
  return (
    <View style={styles.chip}>
      <View style={styles.dot} />
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.ice,
    borderWidth: 0.5,
    borderColor: Colors.haze,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.ocean,
  },
  text: {
    color: Colors.navy,
    fontSize: 12,
    fontWeight: '500',
  },
})
