import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { Message } from '../../types'

// NOTE: Supabase Realtime must be enabled on the `messages` table in the
// Supabase dashboard (Database → Replication) for live updates to work.

export function useMessages(matchId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [locked, setLocked] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('status')
        .eq('id', matchId)
        .single()
      if (matchError) throw matchError

      if (matchData.status !== 'messaging') {
        setLocked(true)
        setMessages([])
        return
      }

      setLocked(false)

      const { data, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
      if (msgError) throw msgError

      setMessages(data ?? [])
    } catch (e: any) {
      setError(e.message ?? 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useEffect(() => {
    fetchMessages()

    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchMessages, matchId])

  async function sendMessage(content: string): Promise<void> {
    if (locked) throw new Error('Messaging is locked until a video call is completed')
    const trimmed = content.trim()
    if (!trimmed) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      match_id: matchId,
      sender_id: session.user.id,
      content: trimmed,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    const { data, error: sendError } = await supabase
      .from('messages')
      .insert({ match_id: matchId, sender_id: session.user.id, content: trimmed })
      .select()
      .single()
    if (sendError) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      throw sendError
    }

    setMessages(prev => prev.map(m => m.id === optimistic.id ? data : m))
  }

  return { messages, locked, loading, error, sendMessage, refetch: fetchMessages }
}
