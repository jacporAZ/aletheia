import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'

export default function Profile() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.frost },
  text: { fontSize: 24, color: Colors.ocean },
})
