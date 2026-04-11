import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { Profile } from '../../types'

type ProfileInput = Omit<Profile, 'id' | 'is_verified' | 'created_at' | 'gender'> & { gender?: 'male' | 'female' | 'other' }

export function useProfile(externalUserId?: string) {
  const [userId, setUserId] = useState<string | undefined>(externalUserId)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (externalUserId) {
      setUserId(externalUserId)
    } else {
      supabase.auth.getUser()
        .then(({ data }) => setUserId(data.user?.id))
        .catch((e) => { setError(e.message ?? 'Auth error'); setLoading(false) })
    }
  }, [externalUserId])

  const fetchProfile = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (fetchError && fetchError.code !== 'PGRST116') {
      setError(fetchError.message)
    } else {
      setProfile(data ?? null)
      setError(null)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  async function saveProfile(input: ProfileInput) {
    if (!userId) throw new Error('Not authenticated')
    const row = { id: userId, ...input }
    const { data, error: saveError } = await supabase
      .from('profiles')
      .upsert(row)
      .select()
      .single()
    if (saveError) throw saveError
    setProfile(data)
  }

  async function uploadPhoto(uri: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg'
    const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic' }
    const contentType = mimeMap[ext] ?? 'image/jpeg'
    const filename = `${user.id}/${Date.now()}.${ext}`

    const response = await fetch(uri)
    const blob = await response.blob()

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filename, blob, { contentType, upsert: false })
    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('photos').getPublicUrl(filename)
    return data.publicUrl
  }

  return { profile, loading, error, saveProfile, uploadPhoto, refetch: fetchProfile }
}
