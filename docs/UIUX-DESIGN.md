# TennisHQ — UI/UX Design System & Screen Specifications

> Version 1.0 | March 16, 2026 | Author: Nadal (Frontend + Design Agent)

---

## 1. Design System

### 1.1 Color Palette (Dark Theme Primary)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#0D0F14` | App background, base layer |
| `bg-secondary` | `#161A23` | Cards, elevated surfaces |
| `bg-tertiary` | `#1E2330` | Input fields, nested cards |
| `bg-hover` | `#252B3A` | Pressed/hover states |
| `text-primary` | `#FFFFFF` | Player names, scores, headings |
| `text-secondary` | `#A0A8BE` | Labels, metadata, secondary info |
| `text-tertiary` | `#5C6478` | Placeholders, disabled text |
| `accent-green` | `#00E676` | Live indicator, positive rank change, win |
| `accent-red` | `#FF5252` | Negative rank change, loss |
| `accent-yellow` | `#FFD740` | Warnings, tiebreak indicator |
| `accent-blue` | `#448AFF` | Links, interactive elements, Hard court |
| `accent-orange` | `#FF9100` | Clay court surface badge |
| `accent-grass` | `#69F0AE` | Grass court surface badge |
| `accent-indoor` | `#B388FF` | Indoor/Carpet court surface badge |
| `surface-card` | `#161A23` | Match cards, list items |
| `surface-card-border` | `#1E2330` | Subtle card borders (1px) |
| `divider` | `#1E2330` | Section dividers, separators |
| `tab-active` | `#FFFFFF` | Active tab text |
| `tab-inactive` | `#5C6478` | Inactive tab text |
| `score-live` | `#00E676` | Live match score color |
| `score-final` | `#FFFFFF` | Final score color |

### 1.2 Typography Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display-lg` | 32px | 700 (Bold) | 40px | Player name on Profile hero |
| `display-md` | 28px | 700 (Bold) | 36px | Match score (final/live) |
| `heading-lg` | 24px | 700 (Bold) | 32px | Screen titles, section headers |
| `heading-md` | 20px | 600 (SemiBold) | 28px | Player names in match cards |
| `heading-sm` | 18px | 600 (SemiBold) | 24px | Player names in lists, sub-headers |
| `body-lg` | 16px | 400 (Regular) | 24px | Body text, descriptions |
| `body-md` | 14px | 400 (Regular) | 20px | Metadata, labels, stats |
| `body-sm` | 12px | 400 (Regular) | 16px | Captions, timestamps, badges |
| `body-xs` | 10px | 500 (Medium) | 14px | Micro labels, surface badges |
| `score-set` | 20px | 700 (Bold) | 24px | Set scores |
| `score-game` | 16px | 600 (SemiBold) | 20px | Game scores |
| `rank-number` | 16px | 700 (Bold) | 20px | Rank position number |

**Font Family:** System default — SF Pro (iOS), Roboto (Android). No custom font loading for performance.

**Player Name Rule:** Player names use minimum `heading-md` (20px/600) everywhere — in cards, lists, brackets, search results. On Profile hero, they use `display-lg` (32px/700). Names are **never** smaller than 18px on any screen.

### 1.3 Spacing System (8px Grid)

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Inline icon padding, tight gaps |
| `space-sm` | 8px | Between related elements (name + flag) |
| `space-md` | 16px | Card internal padding, list item gaps |
| `space-lg` | 24px | Section gaps, card margins |
| `space-xl` | 32px | Screen top padding, major sections |
| `space-2xl` | 48px | Hero sections, tab bar height |

**Card padding:** 16px all sides.  
**Screen horizontal margin:** 16px (cards bleed to edge on Home for carousel feel).  
**List item vertical spacing:** 8px between items, 16px padding inside.

### 1.4 Component Library

#### Avatar

| Context | Size | Border Radius | Fallback |
|---------|------|---------------|----------|
| Profile hero | 96px | 48px (circle) | Initials + country flag bg |
| Match detail header | 80px | 40px (circle) | Initials + country flag bg |
| Match card (Home) | 56px | 28px (circle) | Initials + country flag bg |
| Rankings list item | 48px | 24px (circle) | Initials + country flag bg |
| Search result | 48px | 24px (circle) | Initials + country flag bg |
| Bracket node | 40px | 20px (circle) | Initials + country flag bg |
| H2H previous match | 40px | 20px (circle) | Initials + country flag bg |

- **Always HD:** Request highest resolution from API, cache locally
- **Always rounded:** Full circle, never square or rounded-rect
- **Fallback system:** 2-letter initials (first + last) centered, background = country primary color
- **Border:** 2px solid `bg-primary` for overlapping avatars (doubles, stacked)
- **Shadow:** None — keep flat on dark theme

#### Match Card

```
┌─────────────────────────────────────────────┐
│  [Surface Badge]  Tournament Name · Round   │
│                                             │
│  [Avatar 56px]  Player 1 Name    6  7  6    │
│  [Avatar 56px]  Player 2 Name    4  5  3    │
│                                             │
│  🟢 LIVE · 2nd Set                          │
└─────────────────────────────────────────────┘
```

- Background: `surface-card`
- Border: 1px `surface-card-border`
- Border radius: 12px
- Padding: 16px
- Player names: `heading-md` (20px/600)
- Score numbers: `score-set` (20px/700), monospaced alignment
- Tournament/round label: `body-sm` (12px), `text-secondary`
- Live indicator: 8px pulsing green dot + "LIVE" text in `accent-green`
- Winner row: full opacity; loser row: 60% opacity (completed matches)
- Tap target: entire card

#### Surface Badge

- Small pill shape: padding 4px 8px, border-radius 4px
- Font: `body-xs` (10px/500), uppercase
- Colors by surface:
  - **Hard:** `#448AFF` bg, `#FFFFFF` text → "HARD"
  - **Clay:** `#FF9100` bg, `#FFFFFF` text → "CLAY"
  - **Grass:** `#69F0AE` bg, `#0D0F14` text → "GRASS"
  - **Indoor Hard:** `#B388FF` bg, `#0D0F14` text → "INDOOR"
  - **Carpet:** `#B388FF` bg, `#0D0F14` text → "CARPET"

#### Rank Change Indicator

- Positive: `▲ 3` in `accent-green` (12px/600)
- Negative: `▼ 2` in `accent-red` (12px/600)
- Unchanged: `—` in `text-tertiary` (12px/400)

#### Tab Switcher (Inline)

- Horizontal row, bottom-bordered
- Active tab: `text-primary` + 2px `accent-blue` bottom border
- Inactive tab: `text-tertiary`, no border
- Tab height: 44px (meets touch target)
- Font: `body-lg` (16px/600)

#### Bottom Tab Bar

- Height: 56px + safe area inset
- Background: `bg-secondary` with 1px top border `divider`
- 3 tabs: Home (🏠), Rankings (📊), Search (🔍)
- Active: `accent-blue` icon + label
- Inactive: `text-tertiary` icon + label
- Label font: `body-xs` (10px/500)
- Icon size: 24px

#### Button (Primary)

- Background: `accent-blue`
- Text: `#FFFFFF`, 16px/600
- Height: 48px, border-radius 12px
- Padding: 0 24px
- Pressed: 85% opacity

#### Button (Secondary/Ghost)

- Background: transparent
- Border: 1px `text-tertiary`
- Text: `text-primary`, 16px/600
- Height: 48px, border-radius 12px

#### Stat Bar (Match Statistics)

- Horizontal bar comparing two values
- Player 1 bar extends left, Player 2 bar extends right
- Colors: `accent-blue` (P1) and `accent-green` (P2)
- Center label shows the stat name
- Value labels at each end

#### Skeleton Loading

- Shimmer animation (left-to-right gradient sweep)
- Skeleton color: `bg-tertiary` with 40% opacity shimmer
- Match card skeleton: 2 rectangle lines + 2 circle avatars
- Duration: 1.2s cycle, ease-in-out

### 1.5 Animation Guidelines

| Animation | Duration | Easing | Notes |
|-----------|----------|--------|-------|
| Screen transition (push) | 300ms | ease-out | Slide from right |
| Screen transition (pop) | 250ms | ease-in | Slide to right |
| Tab switch | 200ms | ease-in-out | Crossfade content |
| Pull-to-refresh | 300ms | spring | Overscroll + spinner |
| Live score update | 400ms | ease-out | Fade + slight scale pulse on score change |
| Card press | 100ms | ease-in | Scale to 0.98, opacity to 0.9 |
| Skeleton shimmer | 1200ms | linear | Continuous loop |
| Live dot pulse | 1500ms | ease-in-out | Scale 1.0→1.4→1.0, opacity 1.0→0.4→1.0, infinite |
| Rank change flash | 600ms | ease-out | Background flash green/red then fade |
| Tab indicator slide | 200ms | ease-out | Horizontal translate to active tab |

---

## 2. Screen Specifications

### 2.1 Home Screen

**Purpose:** Primary landing — live action first, today's schedule second.

#### Layout Hierarchy

```
┌──────────────────────────────────────┐
│ Status Bar (system)                  │
├──────────────────────────────────────┤
│ Header: "TennisHQ" logo (left)      │
│         Category pills: All|ATP|WTA  │
├──────────────────────────────────────┤
│ ← SCROLLABLE CONTENT ↕ →            │
│                                      │
│ SECTION: "Live Now" (🟢 dot + count)│
│ ┌────────────────────────────────┐   │
│ │ Match Card (live)              │   │
│ │ [Avatar] Player 1   6 7 3•    │   │
│ │ [Avatar] Player 2   4 5 2     │   │
│ │ 🟢 LIVE · 3rd Set · Miami Open│   │
│ └────────────────────────────────┘   │
│ ┌────────────────────────────────┐   │
│ │ Match Card (live)              │   │
│ └────────────────────────────────┘   │
│                                      │
│ SECTION: "Today's Schedule"          │
│ ── Tournament Header (logo + name) ──│
│ ┌────────────────────────────────┐   │
│ │ Schedule Row                   │   │
│ │ [Av] P1 Name  vs  P2 Name [Av]│   │
│ │ R32 · 14:00 EST               │   │
│ └────────────────────────────────┘   │
│ ┌────────────────────────────────┐   │
│ │ Schedule Row                   │   │
│ └────────────────────────────────┘   │
│                                      │
│ ── Next Tournament Header ──         │
│ ...                                  │
│                                      │
├──────────────────────────────────────┤
│ [🏠 Home] [📊 Rankings] [🔍 Search] │
└──────────────────────────────────────┘
```

#### Component Breakdown

| Component | Spec |
|-----------|------|
| **App header** | 56px height, `bg-primary`, "TennisHQ" in `heading-lg` left-aligned, category pills right-aligned |
| **Category pills** | Horizontal scroll, pill buttons: "All" / "ATP" / "WTA". Active = `accent-blue` bg, inactive = `bg-tertiary` bg |
| **Live section header** | `heading-sm` "Live Now" + pulsing green dot + match count badge |
| **Live match card** | Full-width, 16px horizontal margin. Avatar 56px, names `heading-md`, scores `score-set` right-aligned in columns |
| **Tournament group header** | Tournament logo (24px) + name in `body-md`/`text-secondary`, sticky during scroll |
| **Schedule row** | Two avatars (48px) flanking "vs" text. Names `heading-sm`. Time + round in `body-sm`/`text-secondary` |
| **Date navigator** | Horizontal date strip below category pills (optional P1). Dates as pills: "Yesterday" / "Today" / "Tomorrow" / dates |

#### State Handling

| State | Behavior |
|-------|----------|
| **Loading** | Skeleton: 3 match card skeletons in Live section, 4 schedule row skeletons below |
| **Empty (no live)** | Hide "Live Now" section entirely. Show "Today's Schedule" as primary. If no schedule: "No matches today" + next scheduled date link |
| **Error** | Full-screen error: retry button + "Couldn't load matches" message |
| **Data** | Normal layout as specified |
| **Offline** | Show cached data + amber "Offline" banner below header (40px, `accent-yellow` bg) |

#### Interaction Patterns

| Interaction | Behavior |
|-------------|----------|
| **Pull-to-refresh** | Refresh live scores + schedule. Spring animation, 300ms. |
| **Tap match card** | Push to Match Detail screen |
| **Tap player avatar** | Push to Player Profile screen |
| **Tap tournament header** | Push to Tournament screen |
| **Category pill tap** | Filter matches by ATP/WTA/All. Animate content swap (200ms fade) |
| **Auto-refresh** | Live matches poll every 30s when app is foregrounded. Score changes animate (fade + pulse) |
| **Swipe date** | If date navigator enabled: swipe left/right to change date |

#### API Data Mapping

| UI Element | API Field |
|------------|-----------|
| Player 1 name | `match.homeTeam.name` or `match.homeTeam.shortName` |
| Player 2 name | `match.awayTeam.name` or `match.awayTeam.shortName` |
| Player 1 avatar | `GET /player/{homeTeam.id}/image` |
| Player 2 avatar | `GET /player/{awayTeam.id}/image` |
| Set scores | `match.homeScore.period1` through `period5`, same for away |
| Current game score | `match.homeScore.game`, `match.awayScore.game` |
| Live status | `match.status.type === "inprogress"` |
| Tournament name | `match.tournament.name` |
| Round | `match.roundInfo.name` |
| Surface | `match.tournament.groundType` or from tournament details |
| Scheduled time | `match.startTimestamp` (convert to local) |

---

### 2.2 Player Profile Screen

**Purpose:** Hero screen — the player's identity page. Avatar and name dominate.

#### Layout Hierarchy

```
┌──────────────────────────────────────┐
│ ← Back          "Player"            │
├──────────────────────────────────────┤
│                                      │
│           [Avatar 96px]              │
│           🇪🇸                        │
│       Carlos Alcaraz                 │
│         #2 ATP · Spain               │
│                                      │
│ ┌────┬────┬─────┬─────────────────┐  │
│ │Age │Ht  │Hand │ Backhand        │  │
│ │22  │183 │Right│ Two-handed      │  │
│ └────┴────┴─────┴─────────────────┘  │
│                                      │
│ [Overview] [Matches] [Rankings]      │
│ ─────────────────────────────────────│
│                                      │
│ OVERVIEW TAB:                        │
│ Season Record: 45-8                  │
│ Titles: 4                            │
│                                      │
│ Recent Results:                      │
│ ┌────────────────────────────────┐   │
│ │ W · vs [Av] Sinner 6-4 7-5    │   │
│ │ Miami Open · QF                │   │
│ └────────────────────────────────┘   │
│ ┌────────────────────────────────┐   │
│ │ L · vs [Av] Djokovic 3-6 6-7  │   │
│ └────────────────────────────────┘   │
│                                      │
│ Upcoming:                            │
│ ┌────────────────────────────────┐   │
│ │ vs [Av] Medvedev · SF · 15:00 │   │
│ └────────────────────────────────┘   │
│                                      │
├──────────────────────────────────────┤
│ [🏠 Home] [📊 Rankings] [🔍 Search] │
└──────────────────────────────────────┘
```

#### Component Breakdown

| Component | Spec |
|-----------|------|
| **Nav bar** | Back arrow left, "Player" center, transparent over hero bg |
| **Hero section** | Centered layout. Avatar 96px circle. Country flag emoji below (20px). Name in `display-lg` (32px/700). Ranking badge + country text in `body-lg`/`text-secondary`. Hero bg: subtle gradient from player's country color to `bg-primary` |
| **Bio grid** | 4-column grid. Each cell: value in `heading-sm` (18px/600), label in `body-sm` (12px)/`text-secondary`. Items: Age, Height (cm), Hand, Backhand |
| **Tab switcher** | 3 tabs: Overview / Matches / Rankings. Inline tab component with sliding indicator |
| **Match result row** | W/L badge (green/red pill, 8px radius), opponent avatar (40px), opponent name `body-lg`, score `body-lg`/700, tournament + round `body-sm`/`text-secondary` |
| **Upcoming match row** | "vs" prefix, opponent avatar (40px), opponent name, round, time |

#### State Handling

| State | Behavior |
|-------|----------|
| **Loading** | Hero skeleton: circle + 2 text lines. Tab content: 4 match row skeletons |
| **Empty (no matches)** | "No recent matches" with tennis ball illustration |
| **Error** | Retry button centered in tab content area |
| **Data** | Normal layout |

#### Interaction Patterns

| Interaction | Behavior |
|-------------|----------|
| **Pull-to-refresh** | Refresh player data + matches |
| **Tap match row** | Push to Match Detail |
| **Tap opponent avatar** | Push to opponent's Player Profile |
| **Tab switch** | Slide tab indicator, crossfade content (200ms) |
| **Scroll past hero** | Hero collapses: avatar shrinks to 40px, moves to nav bar alongside name. Parallax effect. |

#### API Data Mapping

| UI Element | API Field |
|------------|-----------|
| Player name | `player.name` |
| Avatar | `GET /player/{id}/image` |
| Country | `player.country.name`, `player.country.alpha2` |
| Country flag | `GET /flag/{alpha2}` |
| Ranking | `player.ranking` |
| Age | Calculated from `player.dateOfBirthTimestamp` |
| Height | `player.height` (cm) |
| Handedness | `player.plays` |
| Backhand | `player.backhand` (if available) |
| Turned pro | `player.turnedPro` |
| Recent matches | `GET /player/{id}/matches/previous` |
| Upcoming matches | `GET /player/{id}/matches/upcoming` |
| Ranking history | `GET /player/{id}/rankings` |
| Recent tournaments | `GET /player/{id}/tournaments` |

---

### 2.3 Rankings Screen

**Purpose:** Scannable ATP/WTA leaderboard with prominent player identity.

#### Layout Hierarchy

```
┌──────────────────────────────────────┐
│ Status Bar                           │
├──────────────────────────────────────┤
│ Header: "Rankings"                   │
│ [ATP] [WTA]  ← tab switcher         │
├──────────────────────────────────────┤
│ ← SCROLLABLE LIST ↕ →               │
│                                      │
│ #1  [Avatar 48px] J. Sinner   🇮🇹    │
│     11,830 pts            — (dash)   │
│ ─────────────────────────────────────│
│ #2  [Avatar 48px] C. Alcaraz 🇪🇸    │
│     9,255 pts             ▲ 1        │
│ ─────────────────────────────────────│
│ #3  [Avatar 48px] A. Zverev  🇩🇪    │
│     8,135 pts             ▼ 1        │
│ ─────────────────────────────────────│
│ ...                                  │
│                                      │
│ [Load More] or infinite scroll       │
│                                      │
├──────────────────────────────────────┤
│ [🏠 Home] [📊 Rankings] [🔍 Search] │
└──────────────────────────────────────┘
```

#### Component Breakdown

| Component | Spec |
|-----------|------|
| **Screen header** | "Rankings" in `heading-lg`, left-aligned |
| **ATP/WTA tabs** | Full-width tab switcher. Active = bold + underline indicator. When live rankings available, show "LIVE" badge (pulsing green dot + text) next to tab |
| **Ranking row** | Height: 72px. Layout: rank number (left, 40px width, `rank-number`), avatar (48px circle), player name (`heading-sm` 18px/600) + country flag (16px inline), points (`body-md`/`text-secondary`), rank change indicator (right-aligned) |
| **Divider** | 1px `divider` between rows, 72px left inset (past rank number) |
| **Live badge** | Green dot (6px) + "LIVE" text in `accent-green`, `body-xs` |

#### State Handling

| State | Behavior |
|-------|----------|
| **Loading** | 10 skeleton ranking rows (circle + 2 text rectangles) |
| **Empty** | "Rankings unavailable" (shouldn't happen) |
| **Error** | Retry button + error message |
| **Data** | Paginated list, 50 items per page, infinite scroll |

#### Interaction Patterns

| Interaction | Behavior |
|-------------|----------|
| **Tap ranking row** | Push to Player Profile |
| **Tab switch (ATP/WTA)** | Crossfade list content, reset scroll to top |
| **Pull-to-refresh** | Reload rankings data |
| **Infinite scroll** | Load next 50 when within 5 items of bottom. Show loading spinner at bottom |

#### API Data Mapping

| UI Element | API Field |
|------------|-----------|
| Rank number | `rankings[i].ranking` |
| Player name | `rankings[i].player.name` or `rankings[i].player.shortName` |
| Player avatar | `GET /player/{rankings[i].player.id}/image` |
| Country flag | `rankings[i].player.country.alpha2` → `GET /flag/{code}` |
| Points | `rankings[i].points` |
| Rank change | `rankings[i].previousRanking` — compute delta from `ranking` |
| Live indicator | Use `/rankings/atp/live` or `/rankings/wta/live` endpoints when during tournament |

---

### 2.4 Match Detail Screen

**Purpose:** Deep match view — score, stats, H2H, point-by-point.

#### Layout Hierarchy

```
┌──────────────────────────────────────┐
│ ← Back       Miami Open · QF        │
├──────────────────────────────────────┤
│ [CLAY]  Court Philippe-Chatrier      │
│                                      │
│  [Avatar 80px]        [Avatar 80px]  │
│  C. Alcaraz           J. Sinner     │
│  🇪🇸 #2                🇮🇹 #1        │
│                                      │
│     6    7    3•                      │
│     4    5    2            🟢 LIVE    │
│                                      │
├──────────────────────────────────────┤
│ [Score] [Stats] [H2H] [Point-by-Pt] │
├──────────────────────────────────────┤
│                                      │
│ STATS TAB:                           │
│                                      │
│  68%  ──█████──  Aces   ──███── 45%  │
│   12    1st Serve %    8             │
│   4     Double Faults  2             │
│  72%    1st Serve Won  68%           │
│  3/7    Break Points   2/4           │
│  45     Total Points   38            │
│                                      │
├──────────────────────────────────────┤
│ [🏠 Home] [📊 Rankings] [🔍 Search] │
└──────────────────────────────────────┘
```

#### Component Breakdown

| Component | Spec |
|-----------|------|
| **Nav bar** | Back arrow, tournament name + round in `body-md` center |
| **Tournament context** | Surface badge (pill) + court name in `body-sm`/`text-secondary` |
| **Score header** | Two-column layout. Each side: avatar (80px), name (`heading-md` 20px/700), flag + ranking (`body-sm`/`text-secondary`). Center: set scores in `score-set` (20px/700), live game score with bullet (•) marker for server. Match status badge right-aligned |
| **Score grid** | Columns for each set (S1, S2, S3, S4, S5) + tiebreak indicator. Winner set score: `text-primary`. Loser set score: `text-secondary`. Tiebreak superscript. |
| **Stat row** | Player 1 value (right-aligned) — stat bar — stat label (center) — stat bar — Player 2 value (left-aligned). Bars use `accent-blue` (P1) and `accent-green` (P2) proportional fill. |
| **H2H header** | Large "3 - 2" with player avatars flanking. "Alcaraz leads H2H 3-2" subtitle. |
| **H2H match list** | Previous meetings: date, tournament, surface badge, score. Winner name bolded. |
| **Point-by-point** | Set/game accordion. Each point: server indicator, score progression, point outcome (ace/winner/error). |
| **Tabs** | 4-tab inline switcher: Score / Stats / H2H / Point-by-Point |

#### State Handling

| State | Behavior |
|-------|----------|
| **Loading** | Score header skeleton (2 circles + score placeholder). Tab content: 6 stat row skeletons |
| **No stats (upcoming)** | Stats/H2H tabs show "Available after match starts". Score tab shows scheduled time + countdown |
| **Error** | Per-tab error with retry |
| **Live** | Score header auto-updates (15s poll). New points animate in. Score changes pulse. |
| **Completed** | Static display. All tabs populated. "FINAL" badge. |

#### Interaction Patterns

| Interaction | Behavior |
|-------------|----------|
| **Tap player avatar/name** | Push to Player Profile |
| **Tab switch** | Slide indicator + crossfade content |
| **Tap H2H previous match** | Push to that Match Detail |
| **Pull-to-refresh** | Refresh all match data |
| **Point-by-point expand** | Accordion expand per set → per game → per point |

#### API Data Mapping

| UI Element | API Field |
|------------|-----------|
| Player 1 / Player 2 | `match.homeTeam`, `match.awayTeam` |
| Avatars | `GET /player/{id}/image` for both |
| Set scores | `match.homeScore.period1`–`period5`, same for away |
| Game score | `match.homeScore.game`, `match.awayScore.game` |
| Tiebreak scores | `match.homeScore.tiebreak1`–`tiebreak5` |
| Match status | `match.status.type` (notstarted, inprogress, finished) |
| Stats | `GET /match/{id}/statistics` → arrays of stat groups |
| H2H record | `GET /h2h/{p1Id}/{p2Id}` → `h2h.homeWins`, `h2h.awayWins` |
| H2H matches | `GET /h2h/{p1Id}/{p2Id}` → `matches[]` |
| Point-by-point | `GET /match/{id}/point-by-point` |
| Tournament | `match.tournament.name`, `match.roundInfo.name` |
| Surface | Tournament details `groundType` |

---

### 2.5 Tournament Screen

**Purpose:** Tournament hub — info, bracket (avatar-driven), schedule, results.

#### Layout Hierarchy

```
┌──────────────────────────────────────┐
│ ← Back         "Tournament"         │
├──────────────────────────────────────┤
│  [Logo 48px]  Miami Open 2026       │
│  [HARD]  Mar 18 – Mar 30            │
│  Hard Rock Stadium, Miami           │
│  ATP Masters 1000                    │
├──────────────────────────────────────┤
│ [Draw] [Schedule] [Results]          │
├──────────────────────────────────────┤
│                                      │
│ DRAW TAB:                            │
│ Round selector: R128|R64|R32|R16|    │
│                 QF|SF|F              │
│                                      │
│ ┌──────── Horizontal Scroll ───────┐ │
│ │                                  │ │
│ │ [Av40] Alcaraz ─┐               │ │
│ │                  ├─ [Av] Alcaraz │ │
│ │ [Av40] Qualifier┘   6-4 6-2     │ │
│ │                       │          │ │
│ │ [Av40] Sinner ──┐    │          │ │
│ │                  ├─ [Av] ?       │ │
│ │ [Av40] Fritz ───┘               │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
├──────────────────────────────────────┤
│ [🏠 Home] [📊 Rankings] [🔍 Search] │
└──────────────────────────────────────┘
```

#### Component Breakdown

| Component | Spec |
|-----------|------|
| **Tournament header** | Logo (48px, use dark variant on dark bg), name in `heading-lg`, surface badge, date range in `body-md`/`text-secondary`, venue in `body-sm`/`text-secondary`, category badge |
| **Tab switcher** | 3 tabs: Draw / Schedule / Results |
| **Round selector** | Horizontal scrollable pill row. Active round = `accent-blue` bg. Tapping jumps bracket to that round column. |
| **Bracket tree** | Horizontal scroll + vertical scroll. Each match node: two player rows (avatar 40px + name `body-md`). Winner row = full opacity + checkmark. Score between rows. Connector lines: 1px `text-tertiary`. |
| **Bracket player node** | Avatar 40px (circle), name truncated at 12 chars + "…", seed number in `body-xs`. Winner: `text-primary`. Loser: 40% opacity. |
| **Schedule list** | Grouped by court. Each row: time, player avatars (40px each), names, round. |
| **Results list** | Grouped by round (descending: Final first). Match card compact style. |

**Bracket Design Rule:** Avatars are 40px minimum in brackets — **large enough to identify players by face alone without reading names.** This is the core differentiator. Connector lines are subtle; avatar circles are prominent.

#### State Handling

| State | Behavior |
|-------|----------|
| **Loading** | Tournament header skeleton + bracket skeleton (grid of circles + lines) |
| **Empty draw** | "Draw not yet available" + expected draw date if known |
| **Error** | Per-tab retry |
| **Data** | Normal layout. Bracket starts at earliest incomplete round. |

#### Interaction Patterns

| Interaction | Behavior |
|-------------|----------|
| **Pinch-to-zoom** | Bracket view supports pinch-to-zoom (0.5x to 2.0x). At 0.5x, see full bracket overview. |
| **Tap bracket match** | Push to Match Detail |
| **Tap bracket player avatar** | Push to Player Profile |
| **Round selector tap** | Smooth scroll bracket to selected round column |
| **Horizontal scroll** | Pan through bracket rounds (left = early rounds, right = final) |
| **Pull-to-refresh** | Refresh draw + schedule |

#### API Data Mapping

| UI Element | API Field |
|------------|-----------|
| Tournament name | `tournament.name` |
| Logo | `GET /tournament/{id}/logo` (dark variant) |
| Surface | `tournament.groundType` |
| Dates | `season.start` – `season.end` |
| Venue | `tournament.venue.city`, `tournament.venue.country` |
| Category | `tournament.category.name` |
| Draw/bracket | `GET /tournament/{id}/season/{seasonId}/draw` → cup tree structure |
| Rounds | `GET /tournament/{id}/season/{seasonId}/rounds` |
| Round matches | `GET /tournament/{id}/season/{seasonId}/round/{roundId}/matches` |
| Schedule | `GET /tournament/{id}/season/{seasonId}/matches/upcoming` |
| Results | `GET /tournament/{id}/season/{seasonId}/matches/last` |
| Seasons (for historical) | `GET /tournament/{id}/seasons` |
| Player avatars in bracket | `GET /player/{id}/image` for each player in draw |

---

### 2.6 Search Screen

**Purpose:** Quick find for players and tournaments.

#### Layout Hierarchy

```
┌──────────────────────────────────────┐
│ Status Bar                           │
├──────────────────────────────────────┤
│ ┌────────────────────────────────┐   │
│ │ 🔍 Search players, tournaments │   │
│ └────────────────────────────────┘   │
├──────────────────────────────────────┤
│                                      │
│ PRE-SEARCH STATE:                    │
│ Trending Players                     │
│ [Av48] Sinner  [Av48] Alcaraz       │
│ [Av48] Gauff   [Av48] Sabalenka     │
│                                      │
│ ── OR (after typing) ──             │
│                                      │
│ SEARCH RESULTS:                      │
│                                      │
│ Players (3)                          │
│ [Av48] Carlos Alcaraz  🇪🇸  #2      │
│ [Av48] Alejandro T...  🇪🇸  #15     │
│ [Av48] Carlos Taberner 🇪🇸  #120    │
│                                      │
│ Tournaments (1)                      │
│ [Logo] Barcelona Open  [CLAY]        │
│        Apr 14–21, 2026               │
│                                      │
├──────────────────────────────────────┤
│ [🏠 Home] [📊 Rankings] [🔍 Search] │
└──────────────────────────────────────┘
```

#### Component Breakdown

| Component | Spec |
|-----------|------|
| **Search bar** | Full-width, 48px height, `bg-tertiary` background, 12px border-radius, search icon left, clear button right (when text present). Font: `body-lg`. Auto-focus on tab entry. |
| **Trending section** | "Trending Players" header in `heading-sm`. 2x2 grid of player chips (avatar 48px + name `body-md`). Shown only when search bar is empty. |
| **Section header** | "Players (n)" / "Tournaments (n)" in `heading-sm`/`text-secondary`, 16px top margin |
| **Player result row** | Height: 64px. Avatar 48px, name `heading-sm` (18px/600), country flag (16px), ranking badge in `body-sm`. |
| **Tournament result row** | Height: 64px. Tournament logo 40px, name `heading-sm`, surface badge, date range `body-sm`/`text-secondary`. |

#### State Handling

| State | Behavior |
|-------|----------|
| **Initial** | Show trending/suggested players (from rankings cache). No search results section. |
| **Typing (< 2 chars)** | "Type at least 2 characters" hint in `text-tertiary` |
| **Loading** | 4 skeleton result rows |
| **Results** | Players section first, Tournaments section second. If one section empty, omit it. |
| **No results** | "No results for '{query}'" with tennis ball illustration |
| **Error** | "Search failed. Try again." + retry button |

#### Interaction Patterns

| Interaction | Behavior |
|-------------|----------|
| **Type in search** | Debounced search (300ms after last keystroke, minimum 2 chars) |
| **Tap player result** | Push to Player Profile |
| **Tap tournament result** | Push to Tournament screen |
| **Clear button** | Clear input, return to trending state |
| **Keyboard dismiss** | Tap outside search bar or scroll results |
| **Tab re-entry** | Preserve last search if navigating back to Search tab |

#### API Data Mapping

| UI Element | API Field |
|------------|-----------|
| Search results | `GET /search/{term}` → `players[]`, `tournaments[]` |
| Player name | `result.player.name` |
| Player avatar | `GET /player/{id}/image` |
| Player ranking | `result.player.ranking` |
| Player country | `result.player.country.alpha2` |
| Tournament name | `result.tournament.name` |
| Tournament logo | `GET /tournament/{id}/logo` |
| Tournament surface | From tournament details |
| Trending players | Pre-cached from rankings endpoint (top 10 by popularity/rank) |

---

## 3. Navigation Specification

### 3.1 Bottom Tab Bar

| Tab | Icon | Label | Default Screen |
|-----|------|-------|----------------|
| 1 | 🏠 (house filled) | Home | Home Screen |
| 2 | 📊 (chart) | Rankings | Rankings Screen (ATP default) |
| 3 | 🔍 (magnifier) | Search | Search Screen |

- Each tab maintains an independent navigation stack
- Tab switch does NOT reset the stack (preserves position)
- Double-tap tab = pop to root of that tab's stack
- Tab bar hides on push screens when keyboard is open

### 3.2 Push Navigation (Stack Screens)

All detail screens are presented as stack pushes (slide from right):

| Screen | Accessible From | Back Returns To |
|--------|----------------|-----------------|
| Match Detail | Home (match card), Player Profile (match row), Tournament (bracket/schedule/results), H2H (previous match) | Previous screen |
| Player Profile | Home (avatar tap), Rankings (row tap), Search (player result), Match Detail (player tap), Tournament (bracket avatar) | Previous screen |
| Tournament | Home (tournament header tap), Search (tournament result), Match Detail (tournament name tap) | Previous screen |

### 3.3 Deep Link Routes

| Pattern | Screen | Params |
|---------|--------|--------|
| `tennishq://match/{matchId}` | Match Detail | matchId |
| `tennishq://player/{playerId}` | Player Profile | playerId |
| `tennishq://tournament/{tournamentId}` | Tournament | tournamentId |
| `tennishq://tournament/{tournamentId}/season/{seasonId}` | Tournament (specific year) | tournamentId, seasonId |
| `tennishq://rankings/{type}` | Rankings | type = "atp" or "wta" |

---

## 4. Responsive Layout

### Screen Size Breakpoints

| Device | Width | Adjustments |
|--------|-------|-------------|
| iPhone SE / small Android | 360–375px | Compact layout, names may truncate at 14 chars |
| iPhone standard | 390–414px | Default layout, all specs as designed |
| iPhone Plus / large Android | 428–430px | Wider cards, longer name display |
| Tablet (post-MVP) | 768px+ | Two-column match list, expanded bracket view |

### Safe Area Handling

- Top: Respect `SafeAreaView` for notch/dynamic island
- Bottom: Tab bar height (56px) + home indicator inset
- Landscape: Not optimized in MVP — lock to portrait

---

## 5. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Touch targets | Minimum 44x44px for all interactive elements |
| Color contrast | All text meets WCAG AA (4.5:1 body, 3:1 large text). Verified: `#FFFFFF` on `#0D0F14` = 18.5:1 ✅. `#A0A8BE` on `#0D0F14` = 7.2:1 ✅. `#5C6478` on `#0D0F14` = 3.6:1 ✅ (large text only). |
| Screen readers | All images have `accessibilityLabel`. Match cards: "{Player1} vs {Player2}, Score {score}, {status}". Rank change: "Rank up 3" / "Rank down 2". |
| Dynamic type | Support iOS Dynamic Type scaling up to 200%. Layout adjusts (cards grow, names wrap). |
| Motion | Respect `prefers-reduced-motion`: disable pulse animations, instant transitions. |
| Color-blind | Rank change uses ▲/▼ arrows + color (not color alone). Surface badges use text labels + color. Live indicator uses dot + "LIVE" text. |

---

*Document maintained by Nadal (Frontend + Design Agent). Last updated: 2026-03-16.*
