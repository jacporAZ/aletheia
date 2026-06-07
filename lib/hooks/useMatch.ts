import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { Match, Profile, VideoCall } from '../../types'

export type MatchDetail = Match & {
  otherProfile: Profile
  latestCall: VideoCall | null
}

type AuthorizedMatch = Match & { userId: string }

export function useMatch(matchId: string) {
  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getAuthorizedMatch = useCallback(async (): Promise<AuthorizedMatch> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error: fetchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .maybeSingle()
    if (fetchError || !data) throw new Error('Match unavailable')

    return { ...data, userId: user.id }
  }, [matchId])

  const fetchMatch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const authorizedMatch = await getAuthorizedMatch()
      const otherUserId = authorizedMatch.user_a === authorizedMatch.userId
        ? authorizedMatch.user_b
        : authorizedMatch.user_a

      const [{ data: otherProfile, error: profileError }, { data: calls, error: callsError }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', otherUserId).single(),
        supabase.from('video_calls').select('*').eq('match_id', matchId),
      ])
      if (profileError || !otherProfile || callsError) throw new Error('Failed to load match')

      const latestCall = (calls ?? []).sort(
        (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
      )[0] ?? null

      setMatch({
        id: authorizedMatch.id,
        user_a: authorizedMatch.user_a,
        user_b: authorizedMatch.user_b,
        status: authorizedMatch.status,
        expires_at: authorizedMatch.expires_at,
        renewed_at: authorizedMatch.renewed_at,
        renewal_count: authorizedMatch.renewal_count,
        created_at: authorizedMatch.created_at,
        otherProfile,
        latestCall,
      })
    } catch (e: any) {
      setMatch(null)
      setError(e.message ?? 'Failed to load match')
    } finally {
      setLoading(false)
    }
  }, [getAuthorizedMatch, matchId])

  useEffect(() => { fetchMatch() }, [fetchMatch])

  async function scheduleCall(scheduledAt: Date): Promise<void> {
    const authorizedMatch = await getAuthorizedMatch()
    const channel = `${matchId}_${Date.now()}`

    const { error: callError } = await supabase
      .from('video_calls')
      .insert({
        match_id: authorizedMatch.id,
        scheduled_at: scheduledAt.toISOString(),
        status: 'scheduled',
        agora_channel: channel,
      })
    if (callError) throw new Error('Failed to schedule call')

    const { error: matchError } = await supabase
      .from('matches')
      .update({ status: 'scheduled' })
      .eq('id', authorizedMatch.id)
      .or(`user_a.eq.${authorizedMatch.userId},user_b.eq.${authorizedMatch.userId}`)
    if (matchError) throw new Error('Failed to update match status')

    await fetchMatch()
  }

  async function completeCall(_callId: string): Promise<void> {
    throw new Error('Call completion must be confirmed by the backend.')
  }

  return { match, loading, error, refetch: fetchMatch, scheduleCall, completeCall }
}
