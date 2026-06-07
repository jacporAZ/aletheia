import { useState } from 'react'
import { supabase } from '../supabase'
import { MAX_DAILY_LIKES } from './useDiscover'

type LikeResult = { matched: boolean; matchId: string | null }

export function useLike() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function validateTargetUser(targetUserId: string, enforceDailyLimit: boolean): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    if (user.id === targetUserId) throw new Error('You cannot interact with your own profile.')

    if (enforceDailyLimit) {
      const today = new Date().toISOString().split('T')[0]
      const { data: counter, error: counterError } = await supabase
        .from('daily_like_counters')
        .select('like_count')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()
      if (counterError) throw new Error('Unable to validate your daily like limit.')
      if ((counter?.like_count ?? 0) >= MAX_DAILY_LIKES) {
        throw new Error('You have reached your daily like limit.')
      }
    }

    return user.id
  }

  async function submitLike(likedUserId: string): Promise<LikeResult> {
    if (submitting) return { matched: false, matchId: null }
    setSubmitting(true)
    setError(null)
    try {
      await validateTargetUser(likedUserId, true)
      const { data, error: rpcError } = await supabase
        .rpc('like_and_check_mutual', { liked_user_id: likedUserId })
      if (rpcError) throw new Error('Unable to process your like right now.')
      return { matched: data.matched, matchId: data.match_id ?? null }
    } catch (e: any) {
      setError(e.message ?? 'Failed to like profile')
      return { matched: false, matchId: null }
    } finally {
      setSubmitting(false)
    }
  }

  async function submitReject(rejectedUserId: string): Promise<void> {
    setError(null)
    try {
      const userId = await validateTargetUser(rejectedUserId, false)
      const { error: insertError } = await supabase
        .from('rejections')
        .insert({ user_id: userId, rejected_user_id: rejectedUserId })
      if (insertError && insertError.code !== '23505') {
        throw new Error('Unable to skip this profile right now.')
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to reject profile')
    }
  }

  return { submitLike, submitReject, submitting, error }
}
