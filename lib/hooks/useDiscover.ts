import { useState, useCallback } from 'react'
import { supabase } from '../supabase'
import { Profile } from '../../types'

export const MAX_DAILY_LIKES = 10

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function useDiscover() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tier, setTier] = useState<'direct' | 'fof'>('direct')
  const [likesRemaining, setLikesRemaining] = useState(MAX_DAILY_LIKES)

  const fetchFeed = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: myProfile, error: profileError } = await supabase
        .from('profiles')
        .select('city')
        .eq('id', user.id)
        .single()
      if (profileError) throw profileError
      if (!myProfile) throw new Error('Profile not found')

      const today = new Date().toISOString().split('T')[0]
      const { data: counter } = await supabase
        .from('daily_like_counters')
        .select('like_count')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()

      const todayCount = counter?.like_count ?? 0
      const remaining = Math.max(0, MAX_DAILY_LIKES - todayCount)
      setLikesRemaining(remaining)

      if (remaining > 0) {
        setTier('direct')

        const [{ data: liked }, { data: rejected }, { data: matched }] = await Promise.all([
          supabase.from('likes').select('liked_user_id').eq('user_id', user.id),
          supabase.from('rejections').select('rejected_user_id').eq('user_id', user.id),
          supabase.from('matches').select('user_a,user_b').or(`user_a.eq.${user.id},user_b.eq.${user.id}`).neq('status', 'expired'),
        ])

        const excludeIds = new Set<string>([user.id])
        liked?.forEach(l => excludeIds.add(l.liked_user_id))
        rejected?.forEach(r => excludeIds.add(r.rejected_user_id))
        matched?.forEach(m => { excludeIds.add(m.user_a); excludeIds.add(m.user_b) })

        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('city', myProfile.city)
          .not('id', 'in', `(${[...excludeIds].join(',')})`)
          .limit(20)
        if (fetchError) throw fetchError

        setProfiles(shuffle(data ?? []))
      } else {
        setTier('fof')

        const { data, error: rpcError } = await supabase
          .rpc('get_fof_profiles', { p_user_id: user.id })
        if (rpcError) throw rpcError

        setProfiles(shuffle(data ?? []))
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to load profiles')
    } finally {
      setLoading(false)
    }
  }, [])

  function removeProfile(id: string) {
    setProfiles(prev => prev.filter(p => p.id !== id))
    if (tier === 'direct') {
      setLikesRemaining(prev => Math.max(0, prev - 1))
    }
  }

  return { profiles, loading, error, tier, likesRemaining, fetchFeed, removeProfile }
}
