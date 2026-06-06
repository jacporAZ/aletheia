# Aletheia v1 Product Specification

**Version:** 1.0  
**Date:** April 10, 2026  
**Last Updated:** June 6, 2026  
**Status:** In Development — Core flows built, Agora integration outstanding  
**Scope:** MVP — Match Engine, Discover Feed, Video Call Scheduling, and Messaging

---

## 0. Current Build Status

> Last reviewed: **June 6, 2026**. The CLAUDE.md build table is outdated — this section reflects the actual state of the codebase.

### ✅ Built & Working

| Area | File(s) | Notes |
|------|---------|-------|
| Project scaffold | `app.json`, `package.json`, `tsconfig.json` | Expo SDK 54, React Native 0.81, TypeScript |
| Supabase connection | `lib/supabase.ts` | Auth, SecureStore session persistence |
| Auth screens | `app/(auth)/login.tsx`, `app/(auth)/register.tsx` | Email/password sign-in and registration |
| Root navigation & auth gating | `app/_layout.tsx` | Session-aware routing: unauthenticated → login, no profile → onboarding, otherwise → tabs |
| Onboarding / profile setup | `app/(onboarding)/setup.tsx` | Name, age, city, gender, front-camera photos (up to 3) |
| Database schema | `types/index.ts` (full type map) | `profiles`, `matches`, `likes`, `rejections`, `vouches`, `friendships`, `video_calls`, `messages`, `daily_like_counters` |
| Discover feed | `app/(tabs)/discover.tsx`, `lib/hooks/useDiscover.ts` | Hinge-style card UI, reaction rail (like / pass / call / vouch), daily cap (10), FoF fallback tier, MutualMatchModal overlay |
| Like & match engine | `lib/hooks/useLike.ts`, `lib/hooks/useDiscover.ts` | Mutual like → match creation, daily counter, reject tracking |
| Matches tab | `app/(tabs)/matches.tsx`, `lib/hooks/useMatches.ts` | List view with status badges, expiry, loading/empty states |
| Match detail screen | `app/(matches)/[id].tsx` | Hero photo, status pill, expiry countdown, messaging-locked card, call info, renew CTA, vouch section |
| Call scheduling UI | `components/CallScheduler.tsx`, `lib/hooks/useMatch.ts` | Date/time picker, schedules call in DB, transitions match to `scheduled` |
| Messages / chat screen | `app/(messages)/[matchId].tsx`, `lib/hooks/useMessages.ts` | Full chat UI, locked-state redirect, real-time capable |
| Messages tab | `app/(tabs)/messages.tsx` | Filters to `messaging` matches only; empty state explains video call requirement |
| Friends-of-friends (vouch) | `lib/hooks/useVouch.ts`, `app/(matches)/[id].tsx` | Vouch eligibility checks (call completed + friendship + cross-gender), submit vouch, `get_fof_profiles` Supabase RPC |
| Profile screen | `app/(tabs)/profile.tsx` | View & edit name/age/bio/city/gender, front-camera photo management, sign out |
| Design system | `constants/colors.ts`, `constants/tokens.ts` | Full colour palette, spacing, radii, shadows |
| Dev tools | `app/(dev)/index.tsx` | Force match, complete call, unlock messaging, sync test profiles, reset daily likes, clear match data |

### ⚠️ Scheduled but Not Yet Wired

| Area | Status | Blocker |
|------|--------|---------|
| Actual video call (in-call screen) | UI schedule flow built; no call screen exists | **Agora SDK not integrated.** Calls can be scheduled and marked complete via Dev Tools, but users cannot actually conduct a call in the app. |
| Push notifications | `expo-notifications` package installed | No notification registration, permission request, or send logic implemented anywhere in the codebase. Notification hooks referenced in the spec (on match, on call scheduled, reminders) are all missing. |
| Missed call auto-handling | Spec defined | Requires Agora webhook or server-side cron to detect missed calls and revert match to `pending`. No backend job exists. |
| Call accept/decline by second user | Spec defined | Currently the other user has no in-app flow to accept or decline a proposed call time before it is committed. |

### ❌ Not Started (Explicitly v2 or Later)

| Area | Notes |
|------|-------|
| Agora SDK integration | Core dependency for actual video calls. Zero code written. |
| Stripe Identity verification | Optional ID verification for premium badge. Out of v1 scope per spec. |
| RevenueCat subscriptions | Monetisation layer. Out of v1 scope per spec. |
| Blocking & reporting | Safety feature deferred to v2. |
| App Store / TestFlight submission | EAS config (`eas.json`) exists; no build or submission has been made. |

### Summary

The app has a complete user-facing UI for the full match-to-message journey: discover → like → match → schedule call → (dev-unlock) → message. All screens, hooks, and the database schema are in place. The **only hard blocker** before the flow works end-to-end for real users is the **Agora integration** (the actual video call). Everything else is either built or explicitly deferred to v2.

---

## 1. User Journey (Complete Flow)

### Phase 1: Profile Discovery
1. User lands on **Discover** screen
2. User sees a feed of potential matches (city-based)
3. User swipes left (reject) or right (like) on profiles
4. Liked profiles are added to a pending match queue

### Phase 2: Mutual Match
1. User receives notification when someone likes them
2. User can like them back (on matches screen or when they appear in discover)
3. **Mutual like = Match created** with status `pending`
4. Both users see each other in **Matches** screen
5. Match will auto-expire in 7 days unless renewed

### Phase 3: Video Call Scheduling
1. User initiates a video call from the Match detail view
2. User picks a time from a dropdown (calendar view)
3. Call status becomes `scheduled`
4. Other user receives a notification
5. At the scheduled time, both users are prompted to join
6. Call occurs via Agora
7. Call status moves to `completed` (or `missed` if not joined)

### Phase 4: Messaging Unlock
1. After a completed video call, match status becomes `messaging`
2. Messages tab becomes active for this match
3. Messaging is fully unlocked — no restrictions on who can message first
4. Users can exchange contact info

### Phase 5: Friends-of-Friends (Optional Discovery Path)
1. After completing a call with a friend, user can vouch for them
2. Vouched friend appears in other users' discover feed (after their daily direct cap is exhausted)
3. This creates a trust signal but does not change match logic

---

## 2. Match State Machine

A match moves through distinct, ordered states. Transitions are one-way unless explicitly renewable.

```
                    ┌─────────────────────────────┐
                    │     MUTUAL LIKE OCCURS      │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌────────────────────────────────┐
                    │ PENDING                        │
                    │ (Awaiting call scheduling)     │
                    │ - Messages: LOCKED             │
                    │ - Call: Can schedule           │
                    │ - Expires in 7 days            │
                    └──────────────┬─────────────────┘
                                   │
                    ┌──────────────┘
                    │
        ┌───────────┴──────────────┐
        │                          │
        │                          │
        ▼                          ▼
  [USER SCHEDULES]         [MATCH EXPIRES]
        │                          │
        │                          ▼
        │              ┌─────────────────────────────┐
        │              │ EXPIRED                     │
        │              │ - Can be renewed by either  │
        │              │ - Returns to PENDING        │
        │              └─────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ SCHEDULED                    │
│ (Call scheduled for future)  │
│ - Messages: LOCKED           │
│ - Call: In progress/upcoming │
│ - Expires in 7 days          │
└──────────────┬───────────────┘
               │
        ┌──────┴──────┐
        │             │
        │             │
        ▼             ▼
  [CALL COMPLETED] [CALL MISSED/EXPIRED]
        │             │
        │             ▼
        │         (Match reverts to PENDING)
        │
        ▼
┌──────────────────────────────┐
│ MESSAGING                    │
│ (Call completed, unlocked)   │
│ - Messages: UNLOCKED         │
│ - Call: Can schedule another │
│ - Expires in 7 days          │
│ - Can renew indefinitely     │
└──────────────────────────────┘
```

### Match Status Enum

| Status | Meaning | Messages Locked? | Call Available? | Expires? | Notes |
|--------|---------|-----------------|-----------------|----------|-------|
| `pending` | Mutual like, no call yet | Yes | Yes | 7 days | Initial state after mutual like |
| `scheduled` | Call scheduled for future | Yes | Yes | 7 days | Transitions when user picks a call time |
| `messaging` | Call completed, unlocked | No | Yes | 7 days | User can now message and schedule more calls |
| `expired` | 7 days elapsed, no action | Yes | No | N/A | Renewable by either user |

### Renewal Logic
- **In `pending` or `scheduled`:** Either user can renew before expiry (extends expires_at by 7 days)
- **In `expired`:** Either user can renew (moves status back to `pending`, extends expires_at by 7 days)
- **In `messaging`:** Match does not expire and can continue indefinitely

### Missed Call Handling
- If a scheduled call is not joined by either user within a grace period (suggest 15 min), it moves to `missed`
- Match reverts to `pending` status
- Both users can reschedule or let it expire

---

## 3. Discover Feed Logic

### Overview
Users see a personalized feed of potential matches. The feed has two tiers:
1. **Direct matches** — profiles of other users in the same city
2. **Friends-of-friends** — profiles vouched for by the user's completed-call friends

### Daily Cap & Tier Rules

**Daily Cap**: User can like/reject up to `MAX_DAILY_LIKES` profiles per calendar day (recommend: 10).

**Tier Logic:**
1. When user opens Discover, show `direct` profiles from their city
2. User can like/reject until they hit the daily cap
3. Once daily cap is reached, show `friends-of-friends` profiles (no additional cap)
4. Cap resets at midnight local time

### Filtering Rules

#### Direct Profiles (Tier 1)
- **City match:** User's city == profile's city
- **Not already matched:** Profile is not in any match with this user (any status except `expired`)
- **Not self:** Profile is not the current user
- **Randomized order:** Show profiles in random order (prevents predictability)

#### Friends-of-Friends Profiles (Tier 2)
- Show only after daily direct cap is exhausted
- **Vouching criteria:** Profile must be vouched for by someone who:
  - Is a friend of the current user (friendship `status = 'accepted'`)
  - Has completed a video call with the current user (match `status = 'messaging'`)
  - Has vouched for the profile (new `vouches` table — see schema)
- **Gender constraint:** Applied at vouch time (see Friends-of-Friends section)
- **Not already matched:** Profile is not in any match with this user (any status except `expired`)
- **Not self:** Profile is not the current user

#### Profiles to Hide
- Profiles blocked by the current user (blocking not in v1 — blocked profiles hide in v2)
- Profiles the user has already liked (pending match exists)
- Profiles the user has already rejected (add `rejected_at` column — see schema gaps)
- The user's own profile

### Algorithm Pseudo-Code

```
function getDiscoverFeed(userId, offset = 0, limit = 10):
  userCity = getUserCity(userId)
  todayLikeCount = getLikeCountToday(userId)
  maxDailyLikes = MAX_DAILY_LIKES  // e.g., 10
  
  if todayLikeCount < maxDailyLikes:
    // Show direct profiles
    remainingCapacity = maxDailyLikes - todayLikeCount
    directProfiles = queryDirectProfiles(
      city: userCity,
      excludeMatchedWith: userId,
      excludeRejectedBy: userId,
      limit: remainingCapacity
    )
    sort directProfiles by random order
    return directProfiles
  else:
    // Show friends-of-friends
    foofProfiles = queryFriendsOfFriendsProfiles(
      userId: userId,
      excludeMatchedWith: userId,
      excludeRejectedBy: userId,
      limit: limit
    )
    sort foofProfiles by random order
    return foofProfiles
    
function queryFriendsOfFriendsProfiles(userId, excludeMatchedWith, excludeRejectedBy, limit):
  acceptedFriends = SELECT * FROM friendships 
                    WHERE (user_id = userId OR friend_id = userId) 
                    AND status = 'accepted'
  
  completedCallFriends = SELECT distinct(friend_id) FROM friendships f
                         JOIN matches m ON (m.user_a = f.friend_id OR m.user_b = f.friend_id)
                         WHERE f.user_id = userId 
                         AND m.status = 'messaging'
  
  mutualFriendWithCall = acceptedFriends INTERSECT completedCallFriends
  
  vouchedProfiles = SELECT p.* FROM profiles p
                    JOIN vouches v ON v.vouched_user_id = p.id
                    WHERE v.voucher_id IN mutualFriendWithCall
                    AND p.id NOT IN excludeMatchedWith
                    AND p.id NOT IN excludeRejectedBy
                    LIMIT limit
  
  return vouchedProfiles
```

### Like & Reject Actions

When user taps "like":
```
function createLike(userId, profileId):
  // Check if already liked
  existingLike = getMatch(userId, profileId)
  if existingLike exists: return error "Already liked"
  
  // Check if other user has liked this user
  reverseMatch = getMatch(profileId, userId)
  
  if reverseMatch exists AND reverseMatch.status == 'pending':
    // MUTUAL LIKE — create real match
    newMatch = createMatch(
      user_a: userId,
      user_b: profileId,
      status: 'pending',
      expires_at: now + 7 days
    )
    notifyUser(profileId, "You matched with " + getUserName(userId))
    return { mutualMatch: true, match: newMatch }
  else:
    // One-way like — mark in likes table (or use match with pending status)
    createMatch(
      user_a: userId,
      user_b: profileId,
      status: 'pending',
      mutual: false
    )
    return { mutualMatch: false }

function createReject(userId, profileId):
  // Mark profile as rejected (add to rejections table or soft-delete)
  createRejection(userId, profileId, rejectedAt: now)
```

### Daily Cap Reset
- Reset occurs at midnight in the user's local timezone
- On first Discover load of the day, check if `lastLikeDate != today()` and reset counter
- Alternative: Store `MAX_DAILY_LIKES` refresh timestamps per user and check server-side

---

## 4. Friends-of-Friends & Vouching Rules

### Overview
A user can vouch for a friend to expand that friend's reach. Vouching creates a trust signal that allows the friend to appear in other users' discover feeds.

### Vouching Preconditions
1. **Voucher must have completed a call with vouchee:** 
   - Voucher and vouchee must have a match with `status = 'messaging'`
   - This ensures the voucher has verified the vouchee via video
2. **Gender constraint (cross-gender only):**
   - If vouchee is male: only female friends can vouch for them
   - If vouchee is female: only male friends can vouch for them
   - Same-gender friends cannot vouch (safety: prevents same-gender circle closes)
3. **Friendship must exist:**
   - Both users must be friends (friendship `status = 'accepted'`)

### Vouch Action

```
function vouchForFriend(voucherId, voucheeId):
  // Precondition 1: Completed call
  callMatch = getMatch(voucherId, voucheeId)
  if !callMatch OR callMatch.status != 'messaging':
    return error "Must complete a video call first"
  
  // Precondition 2: Gender constraint
  voucherGender = getProfile(voucherId).gender
  voucheeGender = getProfile(voucheeId).gender
  if voucherGender == voucheeGender:
    return error "Can only vouch for opposite gender"
  
  // Precondition 3: Friendship
  friendship = getFriendship(voucherId, voucheeId)
  if !friendship OR friendship.status != 'accepted':
    return error "Must be friends first"
  
  // Create vouch record
  vouch = createVouch(
    voucher_id: voucherId,
    vouched_user_id: voucheeId,
    created_at: now,
    gender_constraint_verified: true  // For audit
  )
  
  notifyUser(voucheeId, getUserName(voucherId) + " vouched for you!")
  return { success: true, vouch }
```

### Vouch Visibility

After a vouch is created:
- Vouchee appears in other users' friends-of-friends discover feed if they meet criteria
- Multiple vouches from different people compound credibility (optional: sort by vouch count in future)
- Vouch is one-way: vouchee does not automatically vouch back

### Trust Depth (Not in v1)
- Trust depth (friend-of-friend-of-friend) is explicitly out of scope for v1
- Only show direct friends-of-friends (one hop)
- Future: Could extend to 2+ hops with exponentially lower priority

---

## 5. Video Call Scheduling

### Scheduling Flow

1. **User taps "Schedule Call"** on match detail
2. **App shows calendar picker** with available time slots (24-48 hrs in future, suggest every 30 min)
3. **User selects time slot**
4. **Other user receives push notification** with the proposed time
5. **Other user accepts or declines** (or ignore → auto-decline after 24h)
6. **Call status moves to `scheduled`**
7. **At scheduled time:** Both users get a "Call in 5 minutes" reminder
8. **Users tap "Join Call"** and Agora channel opens

### Database Records

When call is scheduled:
```
INSERT INTO video_calls (
  id, 
  match_id, 
  scheduled_at,    // ISO 8601 timestamp (UTC)
  completed_at,    // NULL until call ends
  status,          // 'scheduled'
  agora_channel    // Generated: "{match_id}_{timestamp}"
) VALUES (...)

UPDATE matches SET status = 'scheduled' WHERE id = match_id
```

When call completes (or is missed):
```
UPDATE video_calls 
SET status = 'completed', completed_at = now 
WHERE id = video_call_id

UPDATE matches SET status = 'messaging' WHERE id = match_id
```

### Call Time Constraints
- Minimum future time: 1 hour (allow time for notification)
- Maximum future time: 30 days (arbitrary cutoff)
- Time slots: 30-minute intervals
- Timezone: Use user's local timezone for display; store `scheduled_at` in UTC

### Notification Rules
- When user schedules a call: Notify other user immediately (push + in-app)
- 5 minutes before scheduled call: Both users get "Call starting" reminder
- If user goes offline during call: Other user sees "Waiting for..." for 2 minutes, then timeout

---

## 6. Messaging

### Unlock Conditions
Messages are **fully locked** until a video call is completed.

**Locked State:**
- Messages tab shows "Complete a video call to unlock messaging"
- No message input available
- Cannot see message history (even if exists from before)

**Unlocked State (after video call completed):**
- Full message history visible (message created on the call completion)
- User can send/receive messages freely
- No sender restrictions (either user can message first)

### Message Timestamps
- All timestamps stored in UTC
- Display in user's local timezone
- Show relative time ("5m ago", "2h ago") with tooltip showing exact time

### Out of Scope (v1)
- Message read receipts
- Typing indicators
- Message search
- Pinned messages
- Voice messages
- Photo/media sharing in messages (text only)

---

## 7. Schema Gaps & Migration Requirements

### New Tables Required

#### `rejections`
Track profiles a user has explicitly rejected (swiped left).

```sql
CREATE TABLE rejections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rejected_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rejected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, rejected_user_id),
  CONSTRAINT no_self_reject CHECK (user_id != rejected_user_id)
);

CREATE INDEX idx_rejections_user_id ON rejections(user_id);
```

#### `likes`
Track profiles a user has liked (swiped right). This is separate from `matches` because a like can be one-way.

```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, liked_user_id),
  CONSTRAINT no_self_like CHECK (user_id != liked_user_id)
);

CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_liked_user_id ON likes(liked_user_id);
```

#### `vouches`
Track which users have vouched for which profiles.

```sql
CREATE TABLE vouches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vouched_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(voucher_id, vouched_user_id),
  CONSTRAINT no_self_vouch CHECK (voucher_id != vouched_user_id)
);

CREATE INDEX idx_vouches_voucher_id ON vouches(voucher_id);
CREATE INDEX idx_vouches_vouched_user_id ON vouches(vouched_user_id);
```

#### `daily_like_counters` (Optional)
Cache for performance. Track likes per user per day.

```sql
CREATE TABLE daily_like_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  like_count INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_like_counters_user_date ON daily_like_counters(user_id, date);
```

### Schema Changes to Existing Tables

#### `profiles` Table
Add `gender` and `gender_verified` columns for vouch logic.

```sql
ALTER TABLE profiles 
ADD COLUMN gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN gender_verified BOOLEAN NOT NULL DEFAULT FALSE;
```

#### `matches` Table
Modify structure to support both one-way likes and mutual matches.

```sql
-- Current match structure is fine, but clarify:
-- A "pending" match means a mutual like has been recorded
-- One-way likes are stored in the "likes" table

-- Add nullable columns to support future enhancements (not used in v1)
ALTER TABLE matches 
ADD COLUMN renewed_at TIMESTAMP,
ADD COLUMN renewal_count INT DEFAULT 0;
```

#### `video_calls` Table
Already exists with correct structure.

#### `messages` Table
Already exists with correct structure. Ensure it respects the lock status of the parent match.

### Row-Level Security (RLS) Policies

```sql
-- Profiles: Users can read any profile in their city
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_profiles_same_city" ON profiles FOR SELECT
USING (
  city = (SELECT city FROM profiles WHERE id = auth.uid())
  OR id = auth.uid()
);

-- Likes: Users can only see their own likes (optional, for analytics)
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_likes" ON likes FOR SELECT
USING (user_id = auth.uid() OR liked_user_id = auth.uid());

-- Matches: Users can only see matches they're part of
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_matches" ON matches FOR SELECT
USING (user_a = auth.uid() OR user_b = auth.uid());

-- Messages: Users can only see messages in their matches
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_messages" ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM matches 
    WHERE matches.id = messages.match_id 
    AND (matches.user_a = auth.uid() OR matches.user_b = auth.uid())
  )
);

-- Vouches: Anyone can read vouches (for trust signals)
ALTER TABLE vouches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_all_vouches" ON vouches FOR SELECT
USING (true);
```

---

## 8. v1 Scope Boundary

### What's In

- **User Authentication:** Sign up, login, logout (already built)
- **Profile Creation:** Name, age, bio, city, photos (already built)
- **Discover Feed:** City-based profiles, daily like cap, friends-of-friends after cap
- **Liking & Rejection:** Swipe-like interaction, track rejects
- **Match Creation:** Mutual like → match in `pending` state
- **Match Expiry & Renewal:** Auto-expire in 7 days, renewable by either user
- **Video Call Scheduling:** Calendar picker, schedule for future time
- **Call Completion:** Mark match as `messaging`, unlock chat
- **Messaging:** Text-based messages (unlock after call only)
- **Friends-of-Friends Vouch:** After completed call, can vouch for opposite-gender friends
- **Friends-of-Friends Discover:** Vouched profiles appear after daily cap exhausted
- **Notifications:** Push notifications for matches, call reminders, vouches

### What's Explicitly Out (v1)

- **Blocking & Reporting:** Users cannot block or report abusive profiles (v2)
- **Unmatching:** Matches do not have an unmatched state; they expire or continue indefinitely (v2)
- **Safety Features:** Two-factor auth, report spam/catfish (v2)
- **ID Verification:** Stripe Identity integration (v2 or later, behind paywall)
- **Subscriptions:** RevenueCat integration (v2 or later)
- **Advanced Filters:** Age range, distance filtering by radius, height, etc. (v2)
- **Photo Verification:** Liveness check, forced selfie on signup (v2)
- **Trust Scoring:** Algorithm to rank profiles by trust depth (v2)
- **Group Features:** Group chats or multi-user matches (out of scope)
- **Video Message Requests:** Send video intros before scheduling calls (v2)
- **Call History:** History of past calls (v2)
- **Analytics Dashboard:** User stats, insights (v2)

---

## 9. Implementation Notes for Dev Team

### Key Assumptions Locked In

1. **City-based matching only:** No geolocation required. Users manually select their city during signup.
2. **Mutual like required:** Single-direction "interest" is tracked in `likes` table but doesn't create a match until reciprocated.
3. **Video call is mandatory gating:** Messaging is fully blocked until `match.status = 'messaging'`.
4. **Call completion is irreversible:** Once a call is marked `completed`, match status is `messaging` forever.
5. **Daily like cap resets at midnight (user's timezone).**
6. **Friends-of-friends shown only after daily cap:** Not a separate tab; same feed, different tier.
7. **Gender constraint for vouch is strict:** No same-gender vouching, period.

### Database Considerations

- Index on `(user_id, rejected_at)` for filtering rejections in discover queries
- Index on `(user_id, liked_at)` for checking like status
- Index on `(user_a, user_b, status)` for match queries (two-way lookup)
- Consider caching `daily_like_counters` or using a trigger to auto-increment
- Use UTC timestamps everywhere; convert to local time at presentation layer

### API Surface (Edge Functions / RPC)

Minimal API surface (suggested):
1. `POST /matches` — Create like (triggers mutual match logic)
2. `POST /matches/{id}/schedule-call` — Schedule a video call
3. `POST /matches/{id}/complete-call` — Mark call as completed
4. `GET /discover/profiles` — Fetch discover feed (direct + f-o-f)
5. `POST /vouches` — Vouch for a friend
6. `GET /friendships` — List friendships (for vouch UI)

All of these should check RLS policies and auth context.

### Frontend Considerations

- Discover tab should debounce "like" clicks (prevent double-click bugs)
- Match expiry should be checked on tab switch and periodically refreshed
- Call scheduling should use device timezone, not user-selected timezone
- Message unlock should be checked before rendering message input
- Daily cap should be checked and UI should clearly show "switch to friends-of-friends" when exhausted

---

## 10. Success Metrics (v1 Launch)

- Users complete signup and create profiles
- Users interact with discover feed (like/reject ratio)
- Mutual matches are created at expected rate
- Video calls are scheduled and completed
- Messaging initiates after call completion
- Friends-of-friends profiles appear in discover feed for active users
- No false unlocks of messaging before call completion
- Match expiry and renewal work correctly

---

## Questions for Clarification (None — CEO answers are complete)

All critical questions have been answered by the CEO. Dev team should flag any ambiguities during implementation.

---

**End of Specification**
