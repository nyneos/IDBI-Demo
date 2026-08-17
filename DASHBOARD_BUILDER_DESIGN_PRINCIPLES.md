# DATACANVAS — DESIGN PRINCIPLES

**Version 1.0 · Source of truth for this project.** Attach alongside every prompt (00–04 and any that follow). Where a prompt and this document disagree, this document wins unless the prompt explicitly says otherwise (prompt 00 §5's exact token hex values are canonical for colour — this document defines the *rules*, prompt 00 defines the *values*).

This is a **separate design system from the IRCTC project.** Nothing here assumes a dark canvas, a single fixed theme, or that aesthetic's heavier motion vocabulary. Where a rule is identical to the IRCTC system (the 12px floor, Lucide-only icons, no clickable divs), it's because that rule is simply correct practice, not because this project inherits IRCTC's visual identity.

---

## 0. The one rule above all others

**This is professional, restrained business software** — the reference screenshots show a clean, flat, low-decoration SaaS aesthetic, closer to Linear or Notion than to a monitoring command centre. Every visual decision in this document optimises for that: legibility over atmosphere, information density that never tips into clutter, motion that confirms state changes and nothing more. If a proposed addition doesn't survive the question *"would a Power BI or Notion designer ship this?"* — it doesn't belong here.

---

## 1. Core principles

1. **Light-first, dark-equal.** The app defaults to light, but dark is not an afterthought — every component is built against tokens, never a hardcoded light-mode colour, so both themes are first-class from the first commit.
2. **Icons are Lucide only.** No emoji, no HTML entities, no hand-authored SVG paths, no icon fonts.
3. **One typeface family active at a time**, chosen from the five-option font list (prompt 00 §5) — never mix families within a single theme.
4. **Colour means state, not decoration.** Categorical chart colours, semantic status colours, and the single brand accent are the entire palette. Nothing else.
5. **Every interactive element has five states**: default, hover, focus-visible, active, disabled.
6. **Motion confirms; it never entertains.** See §9 — this project's motion budget is deliberately smaller than a consumer or command-centre product's would be.
7. **Never fabricate a number.** A calculated field that fails to parse, a chart bound to a field the current data source doesn't have, a relationship that doesn't exist — every one of these renders an honest, specific empty/error state, never a plausible-looking fake value.
8. **Reuse before you build.** This project ports substantial infrastructure from the IRCTC build (chart registry, drag/resize grid, upload pipeline) — check whether a component already exists before writing a new one.

---

## 2. Typography

### 2.1 Family

Five selectable fonts (prompt 00 §5.5 font stack constants), swapped app-wide via `--font-family`: **Plus Jakarta Sans** (default), **Inter**, **IBM Plex Sans**, **Manrope**, **Roboto**. All are variable or static Google/Fontsource faces loaded locally — no runtime CDN font-loading flash.

Numerals in any data context use `font-variant-numeric: tabular-nums`.

### 2.2 Scale — Tailwind defaults, unmodified

Same discipline as the IRCTC project, for the same reason: an unmodified scale is one less thing that can drift.

| Class | Size | Usage |
|---|---|---|
| `text-xs` | 12px | **Floor.** Micro-labels, timestamps, table cells in dense tables, axis ticks, badge text |
| `text-sm` | 14px | **Default body.** Labels, buttons, descriptions, list items, form inputs |
| `text-base` | 16px | Card titles, standard table cells |
| `text-lg` | 18px | Panel/section headings |
| `text-xl` | 20px | Modal titles (`Preferences`), dashboard entity names |
| `text-2xl` | 24px | Panel-level headings where a screen has few enough panels to earn one (used more sparingly here than in the IRCTC system — this app's density is lower) |
| `text-3xl` | 30px | Page-level titles only (`New Dashboard`'s heading, per prompt 00 §4.3) |

**Absolute floor: 12px.** No arbitrary sizes anywhere.

### 2.3 Weight — Tailwind defaults, unmodified

`font-normal` (body), `font-medium` (labels, nav items, buttons), `font-semibold` (headings, table headers, card titles), `font-bold` (page titles). `font-light`/`font-extrabold` are not used in this project — the reference aesthetic doesn't call for either extreme.

---

## 3. Spacing

**Base unit: 4px**, same discipline as before, but **this project runs a more generous scale** than the IRCTC command-centre — the reference screenshots have visible breathing room, not maximum density.

| Token | Value | Usage |
|---|---|---|
| 2 | 8px | Icon-to-label gaps, chip padding |
| 3 | 12px | Tight card-internal stacks |
| 4 | 16px | Standard card padding |
| 5 | 20px | Panel padding, sidebar item padding |
| 6 | 24px | Card grid gap (this project's default — **not** 12px; the denser IRCTC gap doesn't fit this product's calmer layout), section margins |
| 8 | 32px | Page-level section separation, modal padding |
| 10 | 40px | Empty-state vertical rhythm (Image 1's generous centred empty state) |

```
Sidebar width (expanded)   260px
Sidebar width (collapsed)  64px
Top bar height              64px
Screen side padding         32px
Card grid gap                24px
Min click target             40×40px
```

---

## 4. Grid & layout

- 12-column fluid grid, **24px gutters** (not 12px — see §3).
- Content is fluid, no max-width cap, consistent with a full-viewport BI canvas.
- Desktop-primary; below 1024px, the dashboard canvas becomes a single-column stack with drag/resize disabled (same responsive contract as the IRCTC project's grid, ported as-is).

---

## 5. Colour

The full token architecture (three brands × two modes × four surface variants each, composed from 11 CSS blocks) is defined in prompt 00 §5. This section states the **rules** governing how those tokens are used.

### 5.1 Roles

| Role | Token | Rule |
|---|---|---|
| Canvas | `--surface-canvas` | App background, behind all panels |
| Paper | `--surface-paper` | Card/panel background — always `#FFFFFF` in every light variant (only the canvas tint changes between Ghost White/Light Gray/Warm Alabaster/White Smoke; cards stay pure white for maximum content contrast) |
| Border | `--border-default` | 1px hairline, the primary separation device in dark mode; **in light mode, shadow does more of the separation work than the border** — see §7 |
| Text primary/secondary | `--text-primary` / `--text-secondary` | Headings/values vs. body/labels |
| Brand accent | `--brand-accent` (+ hover/active/text/tint variants) | Fills, active nav state, primary buttons, focus rings, links. One of Indigo/Teal Ops/Slate, user-selected, never hardcoded in a component |
| Semantic | `--status-success/warning/error/info` | System state only — resolved/pending/error/neutral. Never decorative, never used to differentiate arbitrary categories |

### 5.2 Categorical chart palette

8-step ramp (`--cat-1` through `--cat-8`) plus `--cat-other`. **Assignment is stable per data source** — the first category encountered in a given uploaded file's data gets `--cat-1`, the second gets `--cat-2`, and so on, persisted alongside that source's profile so colours don't reshuffle between sessions. Never assign by array index at render time — that's what causes a category to be blue in one chart and orange in another.

### 5.3 Contrast

All theme combinations (§5, prompt 00 §5.2–5.3) must clear 4.5:1 for body text and 3:1 for UI boundaries/large text, checked against **both** the palest light variant and the darkest dark variant — a colour that passes on White Smoke and fails on Ghost White is not acceptable; verify against the tightest case in each mode.

---

## 6. Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-md` | 8px | Inputs, buttons, badges |
| `rounded-lg` | 12px | Sidebar nav items, chips |
| `rounded-xl` | 16px | Standard cards, panels |
| `rounded-2xl` | 20px | Feature cards, the empty-state canvas border (Image 1), modals |
| `rounded-full` | pill | Avatar, status pills, brand/surface swatches in Preferences |

Slightly larger radii across the board than the IRCTC system (which topped out at 20px for hero cards) — matches this project's calmer, more consumer-adjacent SaaS surface language versus IRCTC's denser operational one.

---

## 7. Elevation & shadows

**Light mode leans on shadow more than dark mode does** — a hairline border alone doesn't read clearly against a near-white card on a near-white canvas the way it does against a dark panel on a black canvas.

| Token | Light mode value | Dark mode value | Usage |
|---|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(16,24,40,0.05)` | `0 1px 2px rgba(0,0,0,0.4)` | Inputs |
| `shadow-sm` | `0 1px 3px rgba(16,24,40,0.08), 0 1px 2px rgba(16,24,40,0.04)` | `0 1px 3px rgba(0,0,0,0.5)` | Cards, panels (default resting state) |
| `shadow-md` | `0 4px 12px rgba(16,24,40,0.10)` | `0 4px 12px rgba(0,0,0,0.55)` | Dropdowns, popovers, hover elevation |
| `shadow-lg` | `0 12px 24px rgba(16,24,40,0.14)` | `0 12px 24px rgba(0,0,0,0.6)` | Modals (Preferences, confirm dialogs) |

Cards in light mode carry both a `shadow-sm` **and** a 1px `--border-default` — belt and suspenders, since either alone is sometimes too subtle depending on the specific surface variant's tint. In dark mode, the border alone is usually sufficient (matching the IRCTC precedent), with shadow reserved for genuinely floating elements (modals, dropdowns).

Hover elevation on interactive cards: `shadow-sm → shadow-md`, no `translateY` — this project's motion is calmer than IRCTC's; a lift-on-hover reads as more decoration than this aesthetic wants. A colour shift on the border toward `--brand-accent` at 40% is the primary hover cue; the shadow bump is secondary.

---

## 8. Components

### 8.1 Buttons

| Variant | Height | Style |
|---|---|---|
| Primary | 40px | Brand fill, white text, `rounded-md`, `shadow-xs` |
| Secondary | 40px | 1px `--border-default`, `--surface-paper` fill, `--text-primary` |
| Ghost | 36px | No border/fill, `--text-secondary`, hover → `--surface-canvas` tint |
| Icon | 36×36px | Square, `rounded-md`, `aria-label` required |

Text: `text-sm font-medium`, icon 16px, 8px gap. **Never full-pill for dashboard buttons** — the reference screenshots use `rounded-md` rectangular buttons throughout (`Save`, `Relocate`, `New dashboard`, `Edit dashboard`); pill shape is reserved for status badges and the Preferences swatches only.

### 8.2 Panels / Cards

```
┌───────────────────────────────────┐
│ Title (text-lg font-semibold)  [⋯] │  ← optional trailing menu, never a leading icon
├───────────────────────────────────┤
│  Body                              │
├───────────────────────────────────┤
│  Footnote (text-xs, secondary)     │  ← optional
└───────────────────────────────────┘
```

`bg-surface-paper`, `border border-default`, `rounded-xl`, `shadow-sm`, `p-5`. This project does **not** carry over IRCTC's 24px-heading-no-leading-icon rule verbatim as a hard law — use judgement per §2.2's scale, but the "no icon fused directly before a heading string" principle is worth keeping here too, for the same reason: it was correct then and it's correct now.

### 8.3 Tables

Row height 44px, header `text-xs font-semibold uppercase tracking-wider` on `--surface-canvas` tint, 1px bottom hairline per row, hover → subtle canvas-tint background. Numeric columns right-aligned, `tabular-nums`. Same overflow discipline as the IRCTC fix-batch prompt: horizontal scroll with a visible affordance, or ellipsis truncation — never a silent hard clip.

### 8.4 Inputs, Selects, Sliders

40px height, `rounded-md`, 1px border resting, brand-coloured 1.5px + ring on focus. Sliders (what-if parameters, prompt 04 §4) are custom-styled `<input type="range">` — brand-coloured filled track up to the thumb, `--border-default` track beyond it, 16px circular thumb with a `shadow-sm`, never the unstyled OS-native slider.

### 8.5 Modals

`rounded-2xl`, `shadow-lg`, `p-8`, centred with a scrim (`rgba(0,0,0,0.4)` in light mode, `rgba(0,0,0,0.6)` in dark). Title `text-xl font-bold`, subtitle `text-sm text-secondary` directly beneath, per the Preferences modal reference exactly.

### 8.6 Status pills

Solid semantic fill, white text, `rounded-full`, `text-xs font-semibold`, `px-2 py-0.5` — same component contract as the IRCTC project's `StatusPill` (including the darkened `*-pill` contrast-safe token variants for 12px-on-white-text legibility), ported directly rather than redesigned.

---

## 9. Motion

This project's motion budget is intentionally smaller than the IRCTC system's. No custom token file beyond Tailwind defaults + `framer-motion`'s standard easing is required — restraint *is* the design choice here, not an omission.

| Element | Behaviour |
|---|---|
| Panel/modal enter-exit | Opacity + 8px translateY, 200ms, standard ease |
| Sidebar collapse/expand | Width transition, 200ms |
| Drag/resize on the dashboard grid | Ported from IRCTC prompt 09 — functional, not decorative, stays fully active under reduced motion |
| Chart reveal (bar grow, line draw, donut sweep) | A single, restrained pass — no staggered multi-phase choreography like IRCTC's drill transition; this app has no equivalent "drilling into a hierarchy" moment to narrate |
| Preferences swatch selection | Scale + checkmark pop, 150ms |
| Cross-filter/slicer apply | Chart marks interpolate to new values, 200–250ms — never a full re-reveal replay |
| What-if slider drag | Live, debounced ~50ms, no easing lag — must track the thumb 1:1 |

**Explicitly not used in this project:** CursorGrid, ParticleText, SVG-filter border/liquid distortion, staggered entrance sequences longer than a simple fade, any ambient/idle-loop animation. If asked to add one of these later, treat it as a deliberate, separately-considered decision — not a default to reach for, since it contradicts §0.

Reduced motion: same governing principle as before — functional/direct-manipulation interactions (drag, resize, slider drag) stay fully active; decorative reveals collapse to instant or opacity-only.

---

## 10. Accessibility

- Semantic elements only — `<button>`, `<a>`, `<input>`, `<select>`, `<table>`. Zero clickable `<div>`s, including chart marks and grid blocks.
- Visible focus ring on every focusable element: 2px brand-coloured, 2px offset, checked against both modes.
- Full keyboard operability for the dashboard grid (drag/resize has a keyboard-accessible fallback — arrow keys to reposition a focused block by one grid cell, `Shift`+arrows to resize, matching `react-grid-layout`'s documented keyboard support pattern if available, or a custom equivalent if not).
- Every chart has an `aria-label` summary plus a visually-hidden data table.
- Colour is never the sole encoder — conditional formatting icon sets (prompt 04 §6) always pair colour with a shape/icon, never colour alone.
- Contrast verified per §5.3 across the full combination matrix, not just the default theme.

---

## 11. Data integrity — the equivalent of IRCTC's §12, adapted for user-uploaded data

1. **A calculated field that fails to parse never silently evaluates to 0 or blank** — it shows a named error at the point of definition and is excluded from any chart that would otherwise use it, with that chart showing an honest "this field has an error" state rather than a hole in the data.
2. **Cross-source fields require a real relationship** — never an implicit, guessed join on matching field names.
3. **A number shown in more than one place on the same dashboard is computed once and reused**, never recalculated by two different code paths that could silently drift.
4. **Conditional formatting scales recompute against the currently-filtered row set**, not a stale full-dataset range, so a colour scale after filtering still means what it visually claims.
5. **Bookmarks and drill-through filters are always visibly indicated** (the filter chip pattern, §9's cross-filter row) — a dashboard silently showing filtered data with no visible indication that a filter is active is a trust violation for a data tool.

---

## 12. Anti-patterns

Reject at review:

- Any icon that isn't a Lucide component
- Text below 12px, or a 12px use outside a genuine micro-label/timestamp/dense-cell context
- Arbitrary Tailwind values (`text-[13px]`, `p-[18px]`, `rounded-[10px]`)
- A hardcoded light-mode-only colour anywhere in a component (must be a token, checked against dark mode too)
- Full-pill dashboard action buttons
- `translateY` hover-lift on cards (this project uses colour/shadow only, per §7)
- A staggered multi-phase entrance animation copied wholesale from the IRCTC drill-transition pattern — this app has no equivalent narrative moment to justify it
- A filter (cross-filter, slicer, drill-through, bookmark) applied with no visible indicator that it's active
- A calculated field, relationship, or drill-through silently failing instead of showing a specific, honest error
- CursorGrid, ParticleText, or SVG-filter distortion effects imported from the IRCTC project without a separate, deliberate decision to include them
