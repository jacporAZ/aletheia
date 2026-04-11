import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { Match, Profile } from '../../types'

export type MatchWithProfile = Match & { otherProfile: Profile }

export function useMatches() {
  const [matches, setMatches] = useState<MatchWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
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
          user_b_profile:profiles!matches_user_b_fkey(*)
        `)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order('created_at', { ascending: false })
      if (fetchError) throw fetchError

      const withProfiles: MatchWithProfile[] = (data ?? []).map((m: any) => ({
        id: m.id,
        user_a: m.user_a,
        user_b: m.user_b,
        status: m.status,
        expires_at: m.expires_at,
        renewed_at: m.renewed_at,
        renewal_count: m.renewal_count,
        created_at: m.created_at,
        otherProfile: m.user_a === user.id ? m.user_b_profile : m.user_a_profile,
      }))

      setMatches(withProfiles)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load matches')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMatches() }, [fetchMatches])

  async function renewMatch(matchId: string): Promise<void> {
    try {
      const { error: rpcError } = await supabase.rpc('renew_match', { p_match_id: matchId })
      if (rpcError) throw rpcError
      await fetchMatches()
    } catch (e: any) {
      throw e
    }
  }

  return { matches, loading, error, refetch: fetchMatches, renewMatch }
}
