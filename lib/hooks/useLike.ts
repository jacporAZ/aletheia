import { useState } from 'react'
import { supabase } from '../supabase'

type LikeResult = { matched: boolean; matchId: string | null }

export function useLike() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitLike(likedUserId: string): Promise<LikeResult> {
    if (submitting) return { matched: false, matchId: null }
    setSubmitting(true)
    setError(null)
    try {
      const { data, error: rpcError } = await supabase
        .rpc('like_and_check_mutual', { liked_user_id: likedUserId })
      if (rpcError) throw rpcError
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      const { error: insertError } = await supabase
        .from('rejections')
        .insert({ user_id: session.user.id, rejected_user_id: rejectedUserId })
      // Ignore duplicate — already rejected is fine
      if (insertError && insertError.code !== '23505') throw insertError
    } catch (e: any) {
      setError(e.message ?? 'Failed to reject profile')
    }
  }

  return { submitLike, submitReject, submitting, error }
}
