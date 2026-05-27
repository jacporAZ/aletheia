import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../constants/colors'

type Props = {
  visible: boolean
}

export default function DailyCapBanner({ visible }: Props) {
  if (!visible) return null
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Daily limit reached — showing friends of friends</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.ice,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.haze,
  },
  text: {
    fontSize: 14,
    color: Colors.deep,
    textAlign: 'center',
  },
})
