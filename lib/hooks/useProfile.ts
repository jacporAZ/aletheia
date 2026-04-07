import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { Profile } from '../../types'

type ProfileInput = Omit<Profile, 'id' | 'is_verified' | 'created_at'>

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data ?? null)
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  async function saveProfile(input: ProfileInput) {
    if (!userId) throw new Error('Not authenticated')
    const row = { id: userId, ...input }
    const { data, error } = await supabase
      .from('profiles')
      .upsert(row)
      .select()
      .single()
    if (error) throw error
    setProfile(data)
  }

  async function uploadPhoto(uri: string): Promise<string> {
    if (!userId) throw new Error('Not authenticated')
    const filename = `${userId}/${Date.now()}.jpg`

    const response = await fetch(uri)
    const blob = await response.blob()

    const { error } = await supabase.storage
      .from('photos')
      .upload(filename, blob, { contentType: 'image/jpeg', upsert: false })
    if (error) throw error

    const { data } = supabase.storage.from('photos').getPublicUrl(filename)
    return data.publicUrl
  }

  return { profile, loading, saveProfile, uploadPhoto, refetch: fetchProfile }
}
