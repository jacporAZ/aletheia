---
name: Match Engine & Discover Feed v1 Specification
description: Complete product spec for mutual matches, discover feed daily caps, friends-of-friends vouching, and messaging unlock
type: project
---

**Status:** Spec complete and ready for dev team implementation (April 10, 2026).

## Key Decisions Locked In

- **Mutual like required:** One-way likes tracked in `likes` table, but match only created when reciprocated
- **Messaging gated by video call:** Text messaging fully locked until `match.status = 'messaging'`
- **Daily cap of 10 likes/day:** After hitting cap, users see friends-of-friends profiles (same feed, different tier)
- **Friends-of-friends after cap:** Not a separate tab; algorithmic tier within discover feed
- **Vouch gender constraint:** Only opposite-gender friends can vouch for each other
- **Vouch precondition:** Must have completed a video call with the person you're vouching for
- **Call completion irreversible:** Once marked completed, match moves to `messaging` forever
- **7-day match expiry:** Renewable by either user; extends expires_at
- **Matching in `pending` state initially:** Stays pending until user schedules a call

**Why:** These constraints ensure the app's core value proposition (video verification before messaging, trust network built on real interactions).

## Schema Additions Needed

New tables: `rejections`, `likes`, `vouches`, `daily_like_counters` (optional).
Schema changes: Add `gender` and `gender_verified` to profiles table.

See PRODUCT_SPEC.md section 7 for full SQL.

## How to Apply

Dev team should use PRODUCT_SPEC.md as the source of truth for implementation. All state machine logic, filtering rules, and API contracts are defined there.
