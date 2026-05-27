import { View, Text, StyleSheet } from 'react-native'
import { formatDistanceToNow } from 'date-fns'
import { Colors } from '../constants/colors'
import { Message } from '../types'

type Props = {
  message: Message
  isMine: boolean
}

export default function MessageBubble({ message, isMine }: Props) {
  const timestamp = formatDistanceToNow(new Date(message.created_at), { addSuffix: true })

  return (
    <View style={[styles.wrapper, isMine ? styles.wrapperRight : styles.wrapperLeft]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.content, isMine ? styles.contentMine : styles.contentTheirs]}>
          {message.content}
        </Text>
        <Text style={[styles.timestamp, isMine ? styles.timestampMine : styles.timestampTheirs]}>
          {timestamp}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: 12,
    marginVertical: 3,
  },
  wrapperLeft: {
    alignItems: 'flex-start',
  },
  wrapperRight: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bubbleMine: {
    backgroundColor: Colors.ocean,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.haze,
  },
  content: {
    fontSize: 15,
    lineHeight: 21,
  },
  contentMine: {
    color: Colors.white,
  },
  contentTheirs: {
    color: Colors.navy,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  timestampMine: {
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'right',
  },
  timestampTheirs: {
    color: Colors.mist,
  },
})
