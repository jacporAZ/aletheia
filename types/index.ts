export type Profile = {
  id: string
  name: string
  age: number
  bio?: string | null
  city?: string | null
  photos?: string[] | null
  is_verified: boolean
  gender?: 'male' | 'female' | 'other'
  created_at: string
}

export type Match = {
  id: string
  user_a: string
  user_b: string
  status: 'pending' | 'scheduled' | 'messaging' | 'expired'
  expires_at: string
  renewed_at: string | null
  renewal_count: number
  created_at: string
}

export type Like = {
  id: string
  user_id: string
  liked_user_id: string
  liked_at: string
}

export type Rejection = {
  id: string
  user_id: string
  rejected_user_id: string
  rejected_at: string
}

export type Vouch = {
  id: string
  voucher_id: string
  vouched_user_id: string
  created_at: string
}

export type DailyLikeCounter = {
  id: string
  user_id: string
  date: string
  like_count: number
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
