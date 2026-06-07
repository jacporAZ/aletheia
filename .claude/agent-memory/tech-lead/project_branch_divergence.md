---
name: branch-divergence-security-regression
description: develop branch is missing the QA security audit + fixes that were merged to master; develop is an ancestor of master
metadata:
  type: project
---

As of 2026-06-06, `develop` is strictly BEHIND `master` (develop is an ancestor of master; `git merge-base --is-ancestor develop master` is true). All new feature work is happening on `develop`.

Master contains a full QA security audit and the Critical/High fixes from it; develop does NOT. Files present on master but MISSING on develop:
- `SECURITY_AUDIT.md` (QA Engineer audit report, dated 2026-06-06)
- `lib/security.ts` (input sanitization, email/password validation, photo MIME/size/local-URI validation, generic auth error messages, secure nonce)
- QA agent role block in `CLAUDE.md`

Also, the audited/hardened versions of `lib/hooks/useMessages.ts`, `useMatch.ts`, `useProfile.ts`, `useLike.ts` live on master with membership/IDOR checks and removed client-side messaging-unlock. Develop still has the pre-audit versions (e.g. develop's useMessages.ts has NO match-membership check before fetch/subscribe/send).

**Why:** A "consolidate match-engine work onto develop" commit (4668e14) appears to have branched/reset develop from a point before the security PRs (#3, #4, #5) merged to master, so the security work never made it onto develop. New work is now layered on the insecure baseline.

**How to apply:** Before any release or merge of develop, flag that develop must be rebased onto / merged with master FIRST, or the security fixes will be silently reverted. This is high-severity for an identity-verification dating app. Verify current state with `git diff master..develop --stat` before acting — this may be resolved later.
