import type { ImagePickerAsset } from 'expo-image-picker'

export const MAX_EMAIL_LENGTH = 254
export const MIN_PASSWORD_LENGTH = 8
export const MAX_NAME_LENGTH = 50
export const MAX_CITY_LENGTH = 80
export const MAX_BIO_LENGTH = 500
export const MAX_MESSAGE_LENGTH = 1000
export const MAX_PROFILE_PHOTOS = 3
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
])
const LOCAL_MEDIA_URI_PREFIXES = ['file://', 'content://', 'ph://', 'assets-library://']

export function sanitizeSingleLineInput(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function sanitizeMultilineInput(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
    .trim()
}

export function isValidEmail(value: string): boolean {
  return value.length <= MAX_EMAIL_LENGTH && EMAIL_REGEX.test(value)
}

export function isValidPassword(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH && value.length <= 72
}

export function validateProfileInput(input: {
  name: string
  age: number
  city: string
  bio: string
  gender?: 'male' | 'female' | 'other' | null
  photoCount: number
}): string | null {
  if (!input.name) return 'Please enter your name.'
  if (input.name.length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`
  if (!Number.isInteger(input.age) || input.age < 18 || input.age > 100) return 'Please enter a valid age (18–100).'
  if (!input.city) return 'Please enter your city.'
  if (input.city.length > MAX_CITY_LENGTH) return `City must be ${MAX_CITY_LENGTH} characters or fewer.`
  if (input.bio.length > MAX_BIO_LENGTH) return `Bio must be ${MAX_BIO_LENGTH} characters or fewer.`
  if (!input.gender) return 'Please select your gender.'
  if (input.photoCount > MAX_PROFILE_PHOTOS) return `You can add up to ${MAX_PROFILE_PHOTOS} photos.`
  return null
}

export function validateMessageContent(value: string): { value: string; error: string | null } {
  const sanitized = sanitizeMultilineInput(value)
  if (!sanitized) return { value: '', error: 'Message cannot be empty.' }
  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    return { value: sanitized.slice(0, MAX_MESSAGE_LENGTH), error: `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.` }
  }
  return { value: sanitized, error: null }
}

export function validateSelectedPhoto(asset: ImagePickerAsset): string | null {
  if (!isLocalMediaUri(asset.uri)) return 'Please take a new photo with your device camera.'
  if (asset.type && asset.type !== 'image') return 'Only image uploads are allowed.'
  if (asset.mimeType && !ALLOWED_IMAGE_MIME_TYPES.has(asset.mimeType)) {
    return 'Please use a JPEG, PNG, WebP, or HEIC photo.'
  }
  if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE_BYTES) {
    return 'Photo must be 5 MB or smaller.'
  }
  return null
}

export function isAllowedImageMimeType(mimeType: string): boolean {
  return ALLOWED_IMAGE_MIME_TYPES.has(mimeType)
}

export function isLocalMediaUri(uri: string): boolean {
  return LOCAL_MEDIA_URI_PREFIXES.some(prefix => uri.startsWith(prefix))
}

export function getFileExtensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/heic':
      return 'heic'
    case 'image/jpeg':
    default:
      return 'jpg'
  }
}

export function createClientNonce(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16))
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  throw new Error('Secure random generation is unavailable on this device.')
}

export function getGenericAuthErrorMessage(action: 'login' | 'register'): string {
  return action === 'login'
    ? 'Unable to sign in with those credentials.'
    : 'Unable to create your account right now.'
}
