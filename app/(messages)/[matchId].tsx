import { useState, useEffect, useRef } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { useMessages } from '../../lib/hooks/useMessages'
import { useMatches } from '../../lib/hooks/useMatches'
import MessageBubble from '../../components/MessageBubble'
import { supabase } from '../../lib/supabase'
import { Message } from '../../types'

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>()
  const router = useRouter()

  const { messages, locked, loading, sendMessage } = useMessages(matchId)
  const { matches } = useMatches()

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const listRef = useRef<FlatList<Message>>(null)

  const match = matches.find(m => m.id === matchId)
  const otherName = match?.otherProfile?.name ?? 'Chat'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id)
    })
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true })
    }
  }, [messages.length])

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      await sendMessage(trimmed)
      setText('')
    } catch {
      // error displayed by hook
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: true, headerTitle: otherName, headerBackTitle: 'Back' }} />
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={Colors.ocean} />
        </View>
      </SafeAreaView>
    )
  }

  if (locked) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: true, headerTitle: otherName, headerBackTitle: 'Back' }} />
        <View style={styles.centre}>
          <View style={styles.lockedCard}>
            <Text style={styles.lockedTitle}>Messaging Locked</Text>
            <Text style={styles.lockedBody}>
              Complete your video call to unlock messaging.
            </Text>
            <TouchableOpacity
              style={styles.goBtn}
              onPress={() => router.push(`/(matches)/${matchId}` as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.goBtnText}>Go to Match</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, headerTitle: otherName, headerBackTitle: 'Back' }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isMine={item.sender_id === currentUserId} />
          )}
          contentContainerStyle={styles.messageList}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor={Colors.mist}
            multiline
            maxHeight={80}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.frost,
  },
  flex: {
    flex: 1,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  lockedCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.haze,
    width: '100%',
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 10,
  },
  lockedBody: {
    fontSize: 14,
    color: Colors.deep,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  goBtn: {
    backgroundColor: Colors.ocean,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  goBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  messageList: {
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 0.5,
    borderTopColor: Colors.haze,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.frost,
    borderWidth: 1,
    borderColor: Colors.haze,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.navy,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: Colors.ocean,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.haze,
  },
  sendBtnText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
})
