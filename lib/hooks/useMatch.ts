import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { Match, Profile, VideoCall } from '../../types'

export type MatchDetail = Match & {
  otherProfile: Profile
  latestCall: VideoCall | null
}

export function useMatch(matchId: string) {
  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: fetchError } = await supabase
        .from('matches')
        .select(`
          *,
          user_a_profile:profiles!matches_user_a_fkey(*),
          user_b_profile:profiles!matches_user_b_fkey(*),
          video_calls(*)
        `)
        .eq('id', matchId)
        .single()
      if (fetchError) throw fetchError

      const calls: VideoCall[] = data.video_calls ?? []
      const latestCall = calls.sort(
        (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
      )[0] ?? null

      setMatch({
        id: data.id,
        user_a: data.user_a,
        user_b: data.user_b,
        status: data.status,
        expires_at: data.expires_at,
        renewed_at: data.renewed_at,
        renewal_count: data.renewal_count,
        created_at: data.created_at,
        otherProfile: data.user_a === user.id ? data.user_b_profile : data.user_a_profile,
        latestCall,
      })
    } catch (e: any) {
      setError(e.message ?? 'Failed to load match')
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useEffect(() => { fetchMatch() }, [fetchMatch])

  async function scheduleCall(scheduledAt: Date): Promise<void> {
    if (!match) throw new Error('Match not loaded')
    const channel = `${matchId}_${Date.now()}`

    const { error: callError } = await supabase
      .from('video_calls')
      .insert({
        match_id: matchId,
        scheduled_at: scheduledAt.toISOString(),
        status: 'scheduled',
        agora_channel: channel,
      })
    if (callError) throw callError

    const { error: matchError } = await supabase
      .from('matches')
      .update({ status: 'scheduled' })
      .eq('id', matchId)
    if (matchError) throw matchError

    console.log(`[NOTIFICATION] Would notify ${match.otherProfile.name} of scheduled call at ${scheduledAt.toISOString()}`)
    await fetchMatch()
  }

  async function completeCall(callId: string): Promise<void> {
    const { error: callError } = await supabase
      .from('video_calls')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', callId)
    if (callError) throw callError

    const { error: matchError } = await supabase
      .from('matches')
      .update({ status: 'messaging' })
      .eq('id', matchId)
    if (matchError) throw matchError

    console.log(`[NOTIFICATION] Would notify both users that call completed and messaging is unlocked`)
    await fetchMatch()
  }

  return { match, loading, error, refetch: fetchMatch, scheduleCall, completeCall }
}
