import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../supabase'
import { Profile } from '../../types'
import {
  createClientNonce,
  getFileExtensionForMimeType,
  isAllowedImageMimeType,
  isLocalMediaUri,
  MAX_IMAGE_SIZE_BYTES,
  validateProfileInput,
} from '../security'

type ProfileInput = Omit<Profile, 'id' | 'is_verified' | 'created_at' | 'gender'> & { gender?: 'male' | 'female' | 'other' }

export function useProfile(externalUserId?: string) {
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | undefined>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const targetUserId = useMemo(
    () => externalUserId ?? authenticatedUserId,
    [externalUserId, authenticatedUserId]
  )

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data }) => setAuthenticatedUserId(data.user?.id))
      .catch(() => {
        setError('Unable to verify your session.')
        setLoading(false)
      })
  }, [])

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) {
      setProfile(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      setError('Unable to load profile.')
    } else {
      setProfile(data ?? null)
      setError(null)
    }
    setLoading(false)
  }, [targetUserId])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  async function requireAuthenticatedUserId(): Promise<string> {
    if (authenticatedUserId) return authenticatedUserId
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    return user.id
  }

  async function saveProfile(input: ProfileInput) {
    const authenticatedUserId = await requireAuthenticatedUserId()
    const validationError = validateProfileInput({
      name: input.name,
      age: input.age,
      city: input.city ?? '',
      bio: input.bio ?? '',
      gender: input.gender,
      photoCount: input.photos?.length ?? 0,
    })
    if (validationError) throw new Error(validationError)

    const row = { id: authenticatedUserId, ...input }
    const { data, error: saveError } = await supabase
      .from('profiles')
      .upsert(row)
      .select()
      .single()
    if (saveError) throw new Error('Failed to save profile.')
    setProfile(data)
  }

  async function uploadPhoto(uri: string): Promise<string> {
    const authenticatedUserId = await requireAuthenticatedUserId()
    if (!isLocalMediaUri(uri)) {
      throw new Error('Please take a new photo with your device camera.')
    }

    let blob: Blob
    try {
      const response = await fetch(uri)
      blob = await response.blob()
    } catch {
      throw new Error('Failed to load photo from device.')
    }

    const contentType = blob.type || 'image/jpeg'

    if (!isAllowedImageMimeType(contentType)) {
      throw new Error('Please use a JPEG, PNG, WebP, or HEIC photo.')
    }
    if (blob.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('Photo must be 5 MB or smaller.')
    }

    const filename = `${authenticatedUserId}/${createClientNonce()}.${getFileExtensionForMimeType(contentType)}`
    const { error: uploadError } = await supabase.storage
      .from('user_pictures')
      .upload(filename, blob, { contentType, upsert: false })
    if (uploadError) throw new Error('Failed to upload photo.')

    const { data } = supabase.storage.from('user_pictures').getPublicUrl(filename)
    return data.publicUrl
  }

  return { profile, loading, error, saveProfile, uploadPhoto, refetch: fetchProfile }
}
