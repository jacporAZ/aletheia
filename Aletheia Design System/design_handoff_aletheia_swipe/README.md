# Handoff: Aletheia — Swipe & Match flow + Mobile UI Kit

## Overview

Aletheia is a slow, verification-first dating app. This handoff covers:

1. **Design system** — colors, typography, spacing, radii, elevation, glass tokens, iconography, brand.
2. **Mobile UI kit** — a click-thru prototype of the iOS app (login, discover, matches, match detail, video call, messages, chat, profile).
3. **Swipe & Match flow** — three Hinge-style variants (Cards / Editorial / Timeline) with per-section reactions and a glass "match moment" overlay.

The product is React Native / Expo (see `jacporAZ/aletheia` — the existing codebase). Designs should land in that codebase using React Native + StyleSheet (or `NativeWind` / `Tamagui` if already adopted), not as web HTML.

## About the Design Files

The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, **not production code to copy directly**. The task is to **recreate these HTML designs inside the existing Expo / React Native codebase** at `jacporAZ/aletheia`, using its established patterns (`expo-router`, Supabase, the `Colors` constant) and React Native primitives.

Where the HTML uses `backdrop-filter` / `position: absolute` etc., map these to React Native equivalents:
- `backdrop-filter: blur` → `expo-blur` (`<BlurView>`).
- Glass panels → `<BlurView tint="light" intensity={70}>` with a translucent background.
- Lucide icons → `lucide-react-native` (already a reasonable install for this project).
- CSS variables → tokens in `constants/tokens.ts` (extend the existing `constants/colors.ts`).

## Fidelity

**High-fidelity.** Pixel-perfect mockups with final colors, typography, spacing, glass layering, and interaction moments. Recreate pixel-perfectly. The only latitude is platform adaptation (RN `FlatList` instead of scroll divs, `Pressable` instead of `<button>`, etc.).

## Design Tokens

### Colors (source of truth: `colors_and_type.css`)

| Token | Hex | Role |
|---|---|---|
| `ocean` | `#1A6BB5` | Primary brand — main CTAs, selected tab |
| `sky` | `#378ADD` | Secondary CTA, links |
| `mist` | `#85B7EB` | Inactive icons, placeholder text, mutes |
| `haze` | `#B5D4F4` | Hairline borders, dividers |
| `ice` | `#EAF4FD` | Card surface (tinted / inset) |
| `frost` | `#F2F8FE` | Page background |
| `white` | `#FFFFFF` | Primary surface |
| `navy` | `#0C447C` | Headings, emphasis |
| `deep` | `#185FA5` | Body copy on white |
| `verified` | `#5DCAA5` | **Reserved exclusively for the verified badge.** Do not reuse for success / generic green. |

### Typography

- **Brand face:** `Carmilla` (bundled — `fonts/Carmilla_Personal_Use.otf`). Used for the `ALETHEIA` wordmark and hero display text only. On RN, load with `expo-font`.
- **Display:** Geist 600, `letter-spacing: -0.01em`. Used for section headings (H1/H2).
- **UI:** Inter 400/500/600. Used for all body, labels, buttons.
- **Mono:** JetBrains Mono — captions and metadata only.

Wordmark specifically: `Carmilla 400`, `letter-spacing: 0.32em–0.5em`, uppercase, color `ocean` (or white on dark backgrounds).

Type scale (px / line-height):
12/16, 13/18, 14/20, 15/22, 16/24, 18/26, 20/28, 24/32, 28/36, 32/40, 42/50, 48/52 (hero).

### Spacing (4pt grid)

`0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.

### Radius

`xs 6`, `sm 10`, `md 12` (inputs/buttons), `lg 16`, `xl 24` (cards), `2xl 32`, `pill 999`, `app-icon 22%` (superellipse-ish).

### Elevation (blue-tinted, very soft)

```
shadow-sm: 0 2px 8px rgba(12,68,124,0.06)
shadow-md: 0 8px 24px rgba(12,68,124,0.08)
shadow-lg: 0 18px 40px rgba(12,68,124,0.12)
shadow-xl: 0 28px 60px rgba(12,68,124,0.18)
```

**Bezel card** (raised surface):
```
inset 0 1px 0 rgba(255,255,255,1),
inset 0 -1px 0 rgba(12,68,124,0.04),
0 2px 4px rgba(12,68,124,0.06),
0 12px 28px rgba(12,68,124,0.12),
0 24px 48px rgba(12,68,124,0.08)
```

**Inset surface** (ice card, pressed-in):
```
inset 0 2px 4px rgba(12,68,124,0.10),
inset 0 1px 0 rgba(12,68,124,0.06),
inset 0 -1px 0 rgba(255,255,255,0.6)
```

### Liquid glass tokens

- `glass-tint`: `rgba(255,255,255,0.55)` (over photo) / `rgba(255,255,255,0.7)` (more opaque, near-black text)
- `glass-tint-navy`: `rgba(12,68,124,0.55)` (in-call HUD)
- `glass-blur`: `blur(28px) saturate(140%)`
- `glass-border`: `rgba(255,255,255,0.6)`
- `glass-shadow`: `0 12px 40px rgba(12,68,124,0.18), inset 0 1px 0 rgba(255,255,255,0.9)`

On RN, use `<BlurView intensity={70} tint="light">` wrapping a translucent-bg `View`. Layer an inset top highlight with a 1px `rgba(255,255,255,0.9)` border-top on the inner View.

### Motion

- Standard ease: `cubic-bezier(0.2, 0.7, 0.2, 1)` @ 220ms
- Celebratory ease: `cubic-bezier(0.16, 1, 0.3, 1)` @ 420–520ms (match moment)
- Tap scale: `scale(0.93–0.96)` on press-down

## Screens / Views

### 1. Login (`app/(auth)/login.tsx`)
Centered stack on frost bg. Logo mark (64px) + `ALETHEIA` wordmark (Carmilla 32, 0.32em tracking). Two glass inputs (email, password). Primary button "Sign in". Bottom link "No account yet? Create one" (sky color).

### 2. Discover — Swipe & Match (3 variants, pick **Variant A · Cards** for v1)

**Variant A · Cards** — light, section-based vertical scroll. Each section is a raised white card with per-section reaction rail at the bottom.

Structure top-to-bottom:
1. **Sticky header** (54px top padding for status bar) — wordmark + daily counter pill (`3/10`).
2. **Hero photo card** — 480px tall, `radius: 24`, shadow-lg. Overlays:
   - Top-left: active-status glass pill (`Active 2h ago`, dot = `verified` if online, else `mist`).
   - Bottom glass bar: `Name, age` (Geist 600 22px, near-black `#0A0A0A`), city below (13px). Right side: verified badge (`#5DCAA5`, ✓ Verified, 11/7px).
3. **Photo reaction rail** — 4 glass circular buttons (52px): Pass (x), Like (heart), Schedule call (video), Ask a friend (user-plus).
4. **Basics row** — briefcase + work, graduation-cap + school (deep color, 14px).
5. **Trust signals card** — 3 columns: Verified, N vouches, response rate. Hairline separators.
6. **"Why you matched" chip row** — ice chips with `ocean` dot prefix.
7. **Prompts** — each is a `Section` card with eyebrow label (mist 11/uppercase), answer in Geist 20 navy, then compact reaction rail.
8. **Second photo** (radius 24, 380px).
9. **Footer** — outline pill button "Not for me — next profile".

### 3. Match moment (overlay)

Triggered on Like / Schedule call / Ask a friend.

- Full-screen backdrop: `rgba(12,68,124,0.45)` + `backdrop-filter: blur(20px) saturate(140%)`.
- Card: 340px max-width, `radius: 28`, `rgba(255,255,255,0.88)` with `blur(40px)`. Entry: scale 0.9→1 + translateY 20→0, opacity 0→1, 520ms with `cubic-bezier(0.16,1,0.3,1)`.
- Top: 220px hero photo of the match, with gradient scrim.
- Center badge: 72px white circle with colored icon (heart / video / user-plus). Spring-scales in 0.3→1 at 140ms delay.
- Copy: "It's a match" / "Call requested" / "Intro requested" (Geist 24/600 navy) + subtitle + primary button (filled with the reaction's color) + ghost "Keep browsing".

### 4. Matches list (`app/(tabs)/matches.tsx`)
Vertical list of match rows (white card, radius 16, 0.5px haze border). Each row: circular avatar (56px gradient), name+age (Geist 600 16), preview line, status pill (pending / scheduled / messaging / expired). Right side: expiry time (mist 11).

### 5. Match detail
Hero photo (420px) with back button (40px glass circle top-left). Name/age + verified, city · work, status pill. Bio. If `status !== messaging`: "Messaging is locked — Complete a video call to unlock chat" info card (ice bg, video icon). Primary CTA "Schedule a call".

### 6. Video call
Full-bleed gradient placeholder (in production: peer video). 92×124 PiP self top-right. Top-left pill: `Name · 02:14` with `verified` dot. Bottom glass HUD (dark tint, `rgba(255,255,255,0.18)`, radius 28): Mute / Video / Flip / End (red). HUD has 4 circular 48px buttons with icon + 11px label below.

### 7. Messages list
Thread rows (not cards — rows divided by 0.5px haze hairlines). Avatar 48px, name 15/600, preview 13 (navy if unread, mist if read), time 11 mist right-aligned.

### 8. Chat
Header: back chevron, 36px avatar, name 15/600 + `● Verified · Call completed` (verified green). Bubbles: `ocean` for self (white text), white + haze border for them. Input: pill-shape on frost bg + send button (44px ocean circle, arrow-up icon).

### 9. Profile
Photos row (3 tiles, 90×112, radius 10). Name, age + verified badge. City, bio. Settings list (white card, 0.5px haze dividers): Trust & verification, Friends & vouches, Notifications, Settings. Sign out at bottom.

### 10. Tab bar (persistent)
Frosted-glass bar at bottom (`rgba(255,255,255,0.85)` + blur), 4 tabs: Discover (compass), Matches (heart), Messages (message-circle), Profile (user). Active color = `ocean`, inactive = `mist`. 11px labels.

## Interactions & Behavior

- **Daily cap:** max 10 likes/day. Counter in header. After 10, disable Like/Call/Vouch actions and show a "Come back tomorrow" state (design TBD).
- **Per-section reactions:** Hinge-style. Liking any section = liking the person. Track which section the like came from (send with the API call — `{ reaction: 'like', anchor: 'prompt-1' }`).
- **Pass:** 'x' at top photo or "Not for me" at bottom. No match moment — advance to next profile.
- **Like / Call / Vouch:** open the match moment overlay. "Keep browsing" dismisses; primary CTA routes to respective flow (schedule, intro request, etc.).
- **Messaging lock:** chat is unavailable until a video call has been completed with the match. Enforce client-side AND server-side.
- **Video-call unlock:** after call ends successfully, `matches.status` flips to `messaging` and chat opens.

## Assets

| Asset | Source | Use |
|---|---|---|
| `logo_navy.png` | `uploads/aletheia_logo_navy.png` | App icon, dark surfaces |
| `logo_white.png` | `uploads/aletheia_logo_white.png` | Mark over photo |
| `logo_transparent.png` | `uploads/aletheia_logo_transparent.png` | Mark on light surfaces |
| `Carmilla_Personal_Use.otf` | `fonts/` | Brand display face |

Profile photos in the mocks are gradient placeholders — production uses Supabase Storage user uploads (see the existing `profile.tsx`).

## State management

- Supabase for auth + data (already wired in `lib/supabase.ts`).
- `expo-router` for navigation.
- Local state for the current swipe index + the match-moment reaction. Persist nothing from the prototype's in-memory profile list.
- Daily-cap count: read from a `swipes_today` row keyed by user+date; increment optimistically.

## Files in this bundle

| File | Purpose |
|---|---|
| `README.md` | This document |
| `colors_and_type.css` | Full token CSS. Port to `constants/tokens.ts` |
| `mobile_ui_kit/index.html` | Click-thru prototype of the whole app |
| `mobile_ui_kit/components.jsx` | Atomic components (Button, Input, ProfilePhoto, StatusPill, TabBar, Wordmark, VerifiedBadge) |
| `mobile_ui_kit/screens.jsx` | Full screens (Login, Discover, Matches, MatchDetail, VideoCall, Messages, Chat, Profile) |
| `swipe_flow/index.html` | Three Hinge-style variants side-by-side + match moment |
| `swipe_flow/swipe.jsx` | Variants A/B/C + `MatchMoment` component |
| `assets/` | Logo PNGs |
| `fonts/Carmilla_Personal_Use.otf` | Brand display face |

## Recommended implementation order

1. Port tokens (`constants/tokens.ts`) and load `Carmilla` via `expo-font`.
2. Build primitive components (`Wordmark`, `Button`, `Input`, `GlassView`, `VerifiedBadge`, `StatusPill`, `ReactionButton`).
3. Build the Discover screen (Variant A · Cards) — hero photo, sections, reaction rails.
4. Build the Match Moment overlay — this is the emotional peak, spend time on the spring animation.
5. Wire Matches → Match detail → Video call → Chat flow.
6. Profile + settings.
