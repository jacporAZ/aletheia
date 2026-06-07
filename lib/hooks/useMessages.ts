import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { Match, Message } from '../../types'
import { createClientNonce, validateMessageContent } from '../security'

// NOTE: Supabase Realtime must be enabled on the `messages` table in the
// Supabase dashboard (Database → Replication) for live updates to work.

type AuthorizedMatch = Pick<Match, 'id' | 'status'> & { userId: string }

export function useMessages(matchId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [locked, setLocked] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getAuthorizedMatch = useCallback(async (): Promise<AuthorizedMatch> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select('id, status')
      .eq('id', matchId)
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .maybeSingle()
    if (matchError || !matchData) throw new Error('Conversation unavailable')

    return { ...matchData, userId: user.id }
  }, [matchId])

  const fetchMessages = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const matchData = await getAuthorizedMatch()

      if (matchData.status !== 'messaging') {
        setLocked(true)
        setMessages([])
        return false
      }

      setLocked(false)

      const { data, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
      if (msgError) throw new Error('Failed to load messages')

      setMessages(data ?? [])
      return true
    } catch (e: any) {
      setLocked(true)
      setMessages([])
      setError(e.message ?? 'Failed to load messages')
      return false
    } finally {
      setLoading(false)
    }
  }, [getAuthorizedMatch, matchId])

  useEffect(() => {
    let canceled = false
    let activeChannel: ReturnType<typeof supabase.channel> | null = null

    fetchMessages()
      .then((canSubscribe) => {
        if (canceled || !canSubscribe) return

        activeChannel = supabase
          .channel(`messages:${matchId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `match_id=eq.${matchId}`,
            },
            (payload) => {
              const incoming = payload.new as Message
              setMessages(prev =>
                prev.some(m => m.id === incoming.id) ? prev : [...prev, incoming]
              )
            }
          )
          .subscribe()
      })
      .catch(() => {
        setError('Failed to load messages')
      })

    return () => {
      canceled = true
      if (activeChannel) {
        supabase.removeChannel(activeChannel)
      }
    }
  }, [fetchMessages, matchId])

  async function sendMessage(content: string): Promise<void> {
    if (locked) throw new Error('Messaging is locked until a video call is completed')

    const { value: sanitizedContent, error: validationError } = validateMessageContent(content)
    if (validationError) throw new Error(validationError)

    const matchData = await getAuthorizedMatch()
    if (matchData.status !== 'messaging') {
      setLocked(true)
      throw new Error('Messaging is locked until a video call is completed')
    }

    const optimistic: Message = {
      id: `optimistic-${createClientNonce()}`,
      match_id: matchId,
      sender_id: matchData.userId,
      content: sanitizedContent,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    const { data, error: sendError } = await supabase
      .from('messages')
      .insert({ match_id: matchId, sender_id: matchData.userId, content: sanitizedContent })
      .select()
      .single()
    if (sendError) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      throw new Error('Failed to send message')
    }

    setMessages(prev => prev.map(m => m.id === optimistic.id ? data : m))
  }

  return { messages, locked, loading, error, sendMessage, refetch: fetchMessages }
}
