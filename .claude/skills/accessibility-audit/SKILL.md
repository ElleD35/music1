---
name: accessibility-audit
description: Verify WCAG 2.1 AA for Anthem screens — keyboard nav, focus states, contrast ≥4.5:1, labeled fields, aria-live for generation status, lyrics-as-transcript. Use on any new or changed screen. Runs axe checks.
---

# accessibility-audit

Owned by `testing-qa-agent`; supports `frontend-experience-agent`. See PRD §6.3.

## Checklist
- Keyboard: every control reachable and operable; visible focus.
- Contrast: text ≥4.5:1.
- Forms: all fields labeled; errors announced.
- Async: generation status uses `aria-live`.
- Media: lyrics available as an accessible transcript; player controls keyboard/SR-operable.
- Cognitive: plain, calm copy (this audience may be in distress).

## Steps
1. Run axe (e.g., `@axe-core/playwright`) on key screens: intake wizard, keepsake view, library, crisis screen.
2. Fix or file each violation with the owning agent.

## Done when
Key screens pass axe at WCAG 2.1 AA and violations are resolved or filed.

Docs: https://www.w3.org/WAI/WCAG21/quickref/ · https://github.com/dequelabs/axe-core
