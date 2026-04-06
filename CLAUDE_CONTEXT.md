# Aletheia — Project Context

## What this app is
Anti-catfish dating app. Users can only use front camera for photos.
Video call required before messaging unlocks. ID verification via
Stripe Identity unlocks premium features.

## Tech stack
- React Native + Expo (TypeScript)
- Supabase (auth, database, storage)
- Agora SDK (video calls)
- Stripe Identity (ID verification)
- RevenueCat (subscriptions)
- EAS Build (iOS cloud builds)

## Brand
- Name: Aletheia (Greek for unconcealment / revealing truth)
- Colours: ocean #1A6BB5, sky #378ADD, mist #85B7EB,
  haze #B5D4F4, ice #EAF4FD, frost #F2F8FE, navy #0C447C
- Logo: circle with arrow in top right corner
- Font: serif wordmark, clean sans UI

## Database tables
- profiles (id, name, age, bio, city, photos, is_verified)
- matches (id, user_a, user_b, status, expires_at)
- video_calls (id, match_id, scheduled_at, completed_at, status, agora_channel)
- messages (id, match_id, sender_id, content)
- friendships (id, user_id, friend_id, status)

## Current build status
- Project scaffolded with Expo Router
- Supabase client connected
- Auth screens built (login + register)
- Tab placeholder screens built (discover, matches, messages, profile)
- Root layout with session handling built
- Running on Android emulator

## Next to build
1. Fix current emulator errors (supabase env + scheme)
2. Test auth signup and login flow
3. Build front-camera-only profile creation screen
4. Build discover / browse profiles screen
5. Build match engine
6. Build video call scheduling flow
7. Agora video call integration
8. Stripe Identity verification
9. Friends of friends feature
10. RevenueCat subscriptions
