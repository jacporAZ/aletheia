export type Profile = {
  id: string
  name: string
  age: number
  bio: string
  city: string
  photos: string[]
  is_verified: boolean
  created_at: string
}

export type Match = {
  id: string
  user_a: string
  user_b: string
  status: 'pending' | 'scheduled' | 'called' | 'messaging' | 'expired'
  expires_at: string
  created_at: string
}

export type VideoCall = {
  id: string
  match_id: string
  scheduled_at: string
  completed_at: string | null
  status: 'scheduled' | 'completed' | 'missed'
  agora_channel: string
}

export type Message = {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
}

export type Friendship = {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted'
  created_at: string
}
