import { useState, useCallback } from 'react'
import { supabase } from '../supabase'
import { Profile } from '../../types'

export type PotentialMatch = {
  userId: string
  likedAt: string
  profile: Profile
}

export function usePotentialMatches() {
  const [potentials, setPotentials] = useState<PotentialMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPotentials = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: fetchError } = await supabase
        .from('likes')
        .select(`
          user_id,
          liked_at,
          profile:profiles!likes_user_id_fkey(*)
        `)
        .eq('liked_user_id', user.id)
        .order('liked_at', { ascending: false })
      if (fetchError) throw fetchError

      setPotentials(
        (data ?? []).map((row: any) => ({
          userId: row.user_id,
          likedAt: row.liked_at,
          profile: row.profile,
        }))
      )
    } catch (e: any) {
      setError(e.message ?? 'Failed to load potential matches')
    } finally {
      setLoading(false)
    }
  }, [])

  async function likeBack(userId: string): Promise<{ matchId: string | null }> {
    const { data, error: rpcError } = await supabase
      .rpc('like_and_check_mutual', { liked_user_id: userId })
    if (rpcError) throw new Error('Unable to process your like.')
    setPotentials(prev => prev.filter(p => p.userId !== userId))
    return { matchId: data.match_id ?? null }
  }

  async function dismiss(userId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error: insertError } = await supabase
      .from('rejections')
      .insert({ user_id: user.id, rejected_user_id: userId })
    if (insertError && insertError.code !== '23505') {
      throw new Error('Unable to dismiss this profile.')
    }
    setPotentials(prev => prev.filter(p => p.userId !== userId))
  }

  return { potentials, loading, error, fetchPotentials, likeBack, dismiss }
}
