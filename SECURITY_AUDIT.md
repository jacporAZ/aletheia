# Aletheia Security Audit Report

**Conducted by:** QA Engineer Agent  
**Date:** 2026-06-06  
**Scope:** Full client-side codebase review

## Executive Summary
The client-side audit found one Critical issue and several High-risk authorization and business-logic flaws. The most serious problem was a production-accessible dev screen that exposed dangerous RPC helpers. I fixed all Critical and High findings in the React Native/TypeScript codebase, including dev-route gating, match/message authorization checks, removal of client-side messaging unlock logic, safer profile/photo handling, and stronger auth/input validation. Remaining risk is concentrated in backend enforcement: Supabase RLS, RPC validation, public storage exposure, and the fact that client-side checks can always be bypassed on a modified app.

## Findings

### [CRITICAL] — Production-exposed dev tooling
**File:** `app/(dev)/index.tsx`  
**Line(s):** 24-27, 43-146  
**Description:** The dev tools route was present in the app bundle and could call privileged RPC helpers (`dev_force_match`, `dev_unlock_messaging`, `dev_complete_call`, `dev_reset_daily_likes`, `dev_clear_match_data`) if a user manually navigated to the route. Hiding the button in the profile screen was not sufficient protection.  
**Impact:** An attacker could create matches, unlock messaging, reset limits, or delete match data if the corresponding backend helpers were reachable.  
**Recommendation:** Hard-block the screen outside development builds and remove dev RPCs from production deployments.  
**Status:** Fixed

### [HIGH] — Match and message IDOR exposure
**File:** `lib/hooks/useMessages.ts`  
**Line(s):** 17-58, 65-132  
**Description:** Message fetching, realtime subscription, and message sending trusted the route `matchId` without first verifying that the authenticated user belonged to the match.  
**Impact:** With weak or missing RLS, a user could subscribe to another user's conversation, read messages, or attempt writes by guessing a match ID.  
**Recommendation:** Verify membership before reading, subscribing, or sending, and keep backend RLS on `matches` and `messages` strict.  
**Status:** Fixed

### [HIGH] — Unauthorized match detail access
**File:** `lib/hooks/useMatch.ts`  
**Line(s):** 17-65  
**Description:** Match detail loading trusted the supplied `matchId` and previously fetched related profile/call data without scoping the query to the authenticated participant.  
**Impact:** With insufficient backend enforcement, a user could access another match's profile and call metadata.  
**Recommendation:** Scope match reads to `user_a`/`user_b` membership before loading related records.  
**Status:** Fixed

### [HIGH] — Client-side messaging unlock bypass
**File:** `lib/hooks/useMatch.ts`  
**Line(s):** 97-99  
**Description:** The hook exposed a `completeCall` client function that directly flipped a match into `messaging` state. That allowed messaging unlock to happen entirely from the client.  
**Impact:** A tampered client could bypass the “video call required before messaging” control.  
**Recommendation:** Move call completion and messaging unlock to a trusted backend path only.  
**Status:** Fixed

### [HIGH] — Profile mutation target confusion
**File:** `lib/hooks/useProfile.ts`  
**Line(s):** 15-24, 60-87  
**Description:** The profile hook mixed “profile being viewed” with “authenticated profile being edited”. When `externalUserId` was supplied, `saveProfile` could target that external ID instead of the logged-in user.  
**Impact:** Future or accidental use of `useProfile(externalUserId)` for editing could overwrite another user's profile from the client.  
**Recommendation:** Separate authenticated identity from viewed identity and always save/upload against the authenticated user only.  
**Status:** Fixed

### [HIGH] — Unsafe photo upload validation
**File:** `lib/hooks/useProfile.ts`  
**Line(s):** 90-115  
**Description:** Photo uploads trusted the URI extension, used multipart `FormData` directly, and did not enforce allowed MIME types, local-device-only sources, or file-size limits.  
**Impact:** Users could upload oversized or unexpected file types, and remote/non-camera URIs had weaker safeguards than intended.  
**Recommendation:** Validate source URIs, MIME type, and size before upload; upload validated blobs with canonical extensions only.  
**Status:** Fixed

### [HIGH] — Daily-like and self-like business-rule bypass
**File:** `lib/hooks/useLike.ts`  
**Line(s):** 11-63  
**Description:** The like/reject hook did not block self-actions and did not verify the daily-like counter before calling the like RPC.  
**Impact:** Users could attempt to like themselves or exceed the client-enforced daily cap using alternate flows in the app.  
**Recommendation:** Reject self-actions and validate the current daily counter before invoking like logic; also enforce the same rule server-side.  
**Status:** Fixed

### [MEDIUM] — Authentication error leakage and weak client validation
**File:** `app/(auth)/login.tsx`  
**Line(s):** 21-46  
**Description:** Login surfaced raw backend auth errors, and auth forms lacked consistent input normalization and stronger password policy checks.  
**Impact:** Raw auth errors can aid account enumeration or expose backend behavior; weak local validation increases risky input handling.  
**Recommendation:** Normalize inputs, require stronger passwords client-side, and show generic auth failure messages.  
**Status:** Fixed

### [MEDIUM] — Registration flow exposed backend error details
**File:** `app/(auth)/register.tsx`  
**Line(s):** 23-49  
**Description:** Registration displayed raw Supabase errors directly to the user.  
**Impact:** Backend error detail can leak implementation behavior and make auth probing easier.  
**Recommendation:** Replace raw backend errors with generic user-safe messages.  
**Status:** Fixed

### [MEDIUM] — Profile editors lacked bounded text/media validation
**File:** `app/(onboarding)/setup.tsx`  
**Line(s):** 32-95  
**Description:** Profile setup/edit flows did not consistently sanitize text input or enforce client-side max lengths for fields and selected photos.  
**Impact:** Oversized or malformed content could be sent to the backend and later rendered elsewhere in the product.  
**Recommendation:** Sanitize/trim text, add hard client-side limits, and validate selected images before they enter state.  
**Status:** Fixed

### [MEDIUM] — Self-vouch protection missing
**File:** `lib/hooks/useVouch.ts`  
**Line(s):** 42-46, 94-103  
**Description:** The vouch flow did not explicitly block a user from attempting to vouch for themselves.  
**Impact:** A modified or alternate client flow could attempt invalid self-vouch writes.  
**Recommendation:** Reject self-vouch attempts client-side and enforce the same rule in backend constraints/RPC logic.  
**Status:** Fixed

### [LOW] — Missing explicit Supabase configuration guard
**File:** `lib/supabase.ts`  
**Line(s):** 5-10  
**Description:** Supabase environment variables were assumed to exist via non-null assertions.  
**Impact:** Misconfiguration could fail unpredictably and complicate incident response/debugging.  
**Recommendation:** Fail fast with an explicit configuration error.  
**Status:** Fixed

## Fixed Issues
- Blocked the dev tools screen outside development builds (full build exclusion is still recommended).
- Added shared security helpers for input sanitization, auth validation, profile validation, message limits, and image validation.
- Scoped match/message reads and realtime subscriptions to authenticated match participants.
- Removed client-side call-completion/messaging-unlock behavior.
- Split viewed-profile identity from authenticated-profile identity in `useProfile`.
- Enforced local-media-only, MIME-type, and size checks for photo uploads.
- Added self-like/self-reject/self-vouch checks and daily-like validation.
- Replaced raw auth/backend error messages in login/register with generic messages.
- Added bounded field lengths and sanitized profile inputs in onboarding/profile flows.

## Remaining Risks
- **Backend enforcement is still required.** Client-side checks can be bypassed on a modified app; Supabase RLS and RPC validation must remain the source of truth for matches, messages, likes, vouches, and profile edits.
- **Dev tooling should be excluded at build time.** The route is now runtime-blocked, but production builds should ideally omit dev-only screens and RPC entry points entirely.
- **Front-camera-only cannot be guaranteed client-side.** The app requests the front camera, but determined users can tamper with a client. Server-side review, metadata validation, or device attestation is required for stronger assurance.
- **Realtime/privacy depends on Supabase policies.** Even with client scoping, `messages`, `matches`, `video_calls`, and `vouches` need strict row-level access rules.
- **Public storage exposure depends on bucket policy.** If `user_pictures` is public, profile images remain accessible to anyone with the URL.
