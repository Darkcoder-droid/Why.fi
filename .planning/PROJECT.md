# why.fi

## What This Is

why.fi is a webcam-based emotion-mimic game where the user must mimic a target facial expression shown by the system. The product features a gamified, funny, absurd, and slightly chaotic UI with a pixel-art inspired internet-native aesthetic, designed for real-time play.

## Core Value

A highly interactive, absurd, and satisfying "emotion audition machine" that turns facial mimicry into a delightful meme-control-room experience.

## Requirements

### Validated

- ✓ Existing webcam feed and face detection
- ✓ Existing emotion detection and scoring
- ✓ Existing capture of successful photos
- ✓ Existing progress tracking through multiple rounds

### Active

- [ ] Redesign main gameplay screen with a funny internet-native aesthetic and strong visual hierarchy
- [ ] Implement a prominent "Target Expression" module
- [ ] Implement a reactive "Meme panel/board" that updates with detected emotion and audio
- [ ] Add live persistent metrics (Why score, Boredom, Confusion, Dread, Detected face, Progress)
- [ ] Add status banner / system voice messaging
- [ ] Implement captured successful photos gallery/strip
- [ ] Redesign final judgment / results screen with average scores and captured evidence
- [ ] Add game-like motion (target changes, detected changes, match confirmation, cooldown, score updates, final reveal)
- [ ] Ensure the layout works seamlessly on both desktop and laptop webcams without feeling like a generic dashboard

### Out of Scope

- Removing any existing core functionality or metrics (app must retain all previous features)
- Generic SaaS styling, bland white cards, or flat dashboards (must be theatrical and layered)

## Context

The user wants to transform a functional webcam emotion app into a polished, humorous arcade challenge. The UX should balance comedy with usability. It uses a layered background with gradients, subtle texture, shapes, or CRT screen effects. Colors should be bold and intentional.

## Constraints

- **Design**: Must not use default SaaS styling; requires expressive typography and bold intentional colors.
- **Functionality**: Must preserve all current functionality (metrics, photos, webcam) while improving hierarchy and pacing.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use a pixel-art / meme-control-room aesthetic | Strengthens the absurd, chaotic, internet-native concept of the game. | — Pending |

---
*Last updated: 2026-03-25 after initialization*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
