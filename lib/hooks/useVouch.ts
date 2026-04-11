import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { Vouch, Profile } from '../../types'

export type VouchWithProfile = Vouch & { vouchedProfile: Profile }
export type CanVouchResult = { canVouch: boolean; reason?: string }

export function useVouch() {
  const [myVouches, setMyVouches] = useState<VouchWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVouches = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: fetchError } = await supabase
        .from('vouches')
        .select('*, vouchedProfile:profiles!vouches_vouched_user_id_fkey(*)')
        .eq('voucher_id', user.id)
      if (fetchError) throw fetchError

      setMyVouches((data ?? []).map((v: any) => ({
        id: v.id,
        voucher_id: v.voucher_id,
        vouched_user_id: v.vouched_user_id,
        created_at: v.created_at,
        vouchedProfile: v.vouchedProfile,
      })))
    } catch (e: any) {
      setError(e.message ?? 'Failed to load vouches')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchVouches() }, [fetchVouches])

  async function canVouch(voucheeId: string): Promise<CanVouchResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { canVouch: false, reason: 'Not authenticated' }

      const [
        { data: match },
        { data: friendship },
        { data: profiles },
        { data: existing },
      ] = await Promise.all([
        supabase
          .from('matches')
          .select('status')
          .or(`and(user_a.eq.${user.id},user_b.eq.${voucheeId}),and(user_a.eq.${voucheeId},user_b.eq.${user.id})`)
          .eq('status', 'messaging')
          .maybeSingle(),
        supabase
          .from('friendships')
          .select('status')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${voucheeId}),and(user_id.eq.${voucheeId},friend_id.eq.${user.id})`)
          .eq('status', 'accepted')
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('id, gender')
          .in('id', [user.id, voucheeId]),
        supabase
          .from('vouches')
          .select('id')
          .eq('voucher_id', user.id)
          .eq('vouched_user_id', voucheeId)
          .maybeSingle(),
      ])

      if (!match) return { canVouch: false, reason: 'Must complete a video call first' }
      if (!friendship) return { canVouch: false, reason: 'Must be friends first' }
      if (existing) return { canVouch: false, reason: 'Already vouched' }

      const myProfile = profiles?.find(p => p.id === user.id)
      const theirProfile = profiles?.find(p => p.id === voucheeId)
      if (myProfile?.gender && theirProfile?.gender && myProfile.gender === theirProfile.gender) {
        return { canVouch: false, reason: 'Can only vouch for opposite gender' }
      }

      return { canVouch: true }
    } catch (e: any) {
      return { canVouch: false, reason: e.message }
    }
  }

  async function submitVouch(voucheeId: string): Promise<void> {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const check = await canVouch(voucheeId)
      if (!check.canVouch) throw new Error(check.reason ?? 'Cannot vouch')

      const { error: insertError } = await supabase
        .from('vouches')
        .insert({ voucher_id: user.id, vouched_user_id: voucheeId })
      if (insertError) throw insertError

      console.log(`[NOTIFICATION] Would notify ${voucheeId} that ${user.id} vouched for them`)
      await fetchVouches()
    } catch (e: any) {
      setError(e.message ?? 'Failed to submit vouch')
      throw e
    }
  }

  return { myVouches, loading, error, canVouch, submitVouch, refetch: fetchVouches }
}
