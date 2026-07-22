---
name: react-feature-component
description: Build an Anthem React feature/screen with Tailwind + shadcn/ui, wired to TanStack Query hooks, following the calm emotional UX and mobile-first + WCAG 2.1 AA rules. Use for any new UI screen or component.
---

# react-feature-component

Owned by `frontend-experience-agent`. See PRD §2 (avatar), §3, §6.3/§6.4, and CLAUDE.md §7 (UX principles).

## Steps
1. Read the feature story in PRD §3 and the tone guidance.
2. Build with shadcn/ui + Tailwind; mobile-first (works 320px→desktop; touch targets ≥44px).
3. Wire data via TanStack Query hooks (`state-query-hooks`); handle loading, empty, and error states with warm copy.
4. Accessibility: keyboard nav, visible focus, contrast ≥4.5:1, labeled fields, `aria-live` for async status.
5. Request an a11y + component test from `testing-qa-agent`.

## Guardrails
- Hide the machinery — never expose raw AI prompt language.
- Don't invent product copy tone shifts, pricing display, or safety messaging — consume from owners.

## Done when
The component is accessible, responsive, has all states, and is wired to real hooks.

Docs: https://react.dev/ · https://tailwindcss.com/docs · https://ui.shadcn.com/
