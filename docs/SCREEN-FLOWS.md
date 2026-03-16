# TennisHQ — Screen Flows & User Journeys

> Version 1.0 | March 16, 2026 | Author: Nadal (Frontend + Design Agent)

---

## 1. Navigation Architecture

```
┌─────────────────────────────────────────────────────┐
│                    APP ROOT                          │
│                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│   │  Home    │  │ Rankings │  │  Search  │        │
│   │  (Tab 1) │  │ (Tab 2)  │  │ (Tab 3)  │        │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│        │              │              │               │
│        ▼              ▼              ▼               │
│   Match Detail   Player Profile  Player Profile     │
│   Player Profile  Match Detail   Tournament         │
│   Tournament      Tournament     Match Detail       │
│                                                     │
│   (Each tab has its own independent nav stack)      │
└─────────────────────────────────────────────────────┘
```

---

## 2. User Journeys

### Journey 1: Check Live Scores (Primary)

```
App Launch
  │
  ▼
HOME SCREEN (Tab 1 — default)
  │
  ├── See "Live Now" section with active matches
  │   │
  │   ├── [Tap match card] ──────────────► MATCH DETAIL
  │   │                                      │
  │   │                                      ├── [Tap player avatar/name] ► PLAYER PROFILE
  │   │                                      │                                │
  │   │                                      │                                ├── [Tap match row] ► MATCH DETAIL
  │   │                                      │                                │
  │   │                                      │                                └── [← Back] ► MATCH DETAIL
  │   │                                      │
  │   │                                      ├── [Tap tournament name] ► TOURNAMENT
  │   │                                      │
  │   │                                      ├── [Tap H2H previous match] ► MATCH DETAIL (different)
  │   │                                      │
  │   │                                      └── [← Back] ► HOME
  │   │
  │   └── [Tap player avatar directly] ──► PLAYER PROFILE
  │                                          │
  │                                          └── [← Back] ► HOME
  │
  ├── See "Today's Schedule" section
  │   │
  │   ├── [Tap schedule row] ──────────► MATCH DETAIL
  │   │
  │   └── [Tap tournament header] ─────► TOURNAMENT
  │
  └── [Pull down] ► Refresh live scores + schedule
```

### Journey 2: Browse Rankings

```
[Tap Rankings tab]
  │
  ▼
RANKINGS SCREEN (Tab 2)
  │
  ├── Default: ATP rankings shown
  │
  ├── [Tap WTA tab] ► Switch to WTA rankings (same screen)
  │
  ├── [Tap ATP tab] ► Switch to ATP rankings (same screen)
  │
  ├── [Scroll down] ► Infinite scroll, load more players
  │
  ├── [Tap player row] ─────────────────► PLAYER PROFILE
  │   │                                     │
  │   ├── [Tap match in "Matches" tab] ──► MATCH DETAIL
  │   │                                     │
  │   │                                     └── [← Back] ► PLAYER PROFILE
  │   │
  │   └── [← Back] ► RANKINGS
  │
  └── [Pull down] ► Refresh rankings
```

### Journey 3: Search for a Player

```
[Tap Search tab]
  │
  ▼
SEARCH SCREEN (Tab 3)
  │
  ├── See trending players (pre-search)
  │   │
  │   └── [Tap trending player chip] ───► PLAYER PROFILE
  │
  ├── [Tap search bar → type "alcar"]
  │   │
  │   ├── (300ms debounce)
  │   │
  │   ▼
  │   SEARCH RESULTS
  │   │
  │   ├── Players section
  │   │   │
  │   │   └── [Tap "Carlos Alcaraz"] ──► PLAYER PROFILE
  │   │                                    │
  │   │                                    └── [← Back] ► SEARCH (preserves query)
  │   │
  │   └── Tournaments section
  │       │
  │       └── [Tap tournament] ────────► TOURNAMENT
  │                                       │
  │                                       └── [← Back] ► SEARCH (preserves query)
  │
  └── [Tap clear button (✕)] ► Return to trending state
```

### Journey 4: Search for a Tournament

```
[Tap Search tab]
  │
  ▼
SEARCH SCREEN
  │
  ├── [Type "miami"]
  │   │
  │   ▼
  │   SEARCH RESULTS
  │   │
  │   └── Tournaments section
  │       │
  │       └── [Tap "Miami Open"] ──────► TOURNAMENT
  │           │
  │           ├── DRAW tab (default)
  │           │   │
  │           │   ├── [Tap bracket match node] ► MATCH DETAIL
  │           │   │                                │
  │           │   │                                └── [← Back] ► TOURNAMENT
  │           │   │
  │           │   └── [Tap bracket player avatar] ► PLAYER PROFILE
  │           │                                      │
  │           │                                      └── [← Back] ► TOURNAMENT
  │           │
  │           ├── SCHEDULE tab
  │           │   │
  │           │   └── [Tap match row] ─────────► MATCH DETAIL
  │           │
  │           ├── RESULTS tab
  │           │   │
  │           │   └── [Tap match row] ─────────► MATCH DETAIL
  │           │
  │           └── [← Back] ► SEARCH
  │
  └── [← Back / Tab switch] ► Previous state
```

### Journey 5: Deep Dive into a Match

```
(From any entry point: Home, Player Profile, Tournament, Search)
  │
  ▼
MATCH DETAIL
  │
  ├── SCORE tab (default)
  │   │
  │   └── View set-by-set scores, live game score if in progress
  │
  ├── [Tap Stats tab]
  │   │
  │   └── View serve %, aces, break points, etc. (two-column comparison)
  │
  ├── [Tap H2H tab]
  │   │
  │   ├── View career head-to-head record
  │   │
  │   └── [Tap previous H2H match] ───► MATCH DETAIL (that match)
  │                                       │
  │                                       └── [← Back] ► MATCH DETAIL (original)
  │
  ├── [Tap Point-by-Point tab]
  │   │
  │   ├── [Tap set accordion] ► Expand set
  │   │   │
  │   │   └── [Tap game accordion] ► Expand game → see points
  │   │
  │   └── View chronological point-by-point
  │
  ├── [Tap Player 1 avatar/name] ─────► PLAYER PROFILE
  │
  ├── [Tap Player 2 avatar/name] ─────► PLAYER PROFILE
  │
  ├── [Tap tournament name] ───────────► TOURNAMENT
  │
  └── [← Back] ► Previous screen
```

### Journey 6: Explore a Player

```
(From any entry point: Rankings, Search, Match Detail, Tournament bracket)
  │
  ▼
PLAYER PROFILE
  │
  ├── OVERVIEW tab (default)
  │   │
  │   ├── View season record, titles
  │   │
  │   ├── Recent Results
  │   │   │
  │   │   └── [Tap match row] ────────► MATCH DETAIL
  │   │                                  │
  │   │                                  └── [← Back] ► PLAYER PROFILE
  │   │
  │   └── Upcoming Matches
  │       │
  │       └── [Tap match row] ────────► MATCH DETAIL
  │
  ├── [Tap Matches tab]
  │   │
  │   ├── Full paginated match history
  │   │
  │   ├── [Tap match row] ────────────► MATCH DETAIL
  │   │
  │   └── [Scroll down] ► Load more matches (paginated)
  │
  ├── [Tap Rankings tab]
  │   │
  │   └── View ranking history chart (no navigation from here)
  │
  ├── [Tap opponent avatar in any match row] ► PLAYER PROFILE (opponent)
  │                                              │
  │                                              └── [← Back] ► PLAYER PROFILE (original)
  │
  └── [← Back] ► Previous screen
```

---

## 3. Deep Link Entry Points

Deep links allow users to enter the app at any screen directly (from notifications, shared URLs, or external sources).

```
┌─────────────────────────────────────────────────────────┐
│ DEEP LINK                      │ DESTINATION            │
├────────────────────────────────┼────────────────────────┤
│ tennishq://match/{id}          │ Match Detail           │
│ tennishq://player/{id}         │ Player Profile         │
│ tennishq://tournament/{id}     │ Tournament (current)   │
│ tennishq://tournament/{id}/    │ Tournament (specific   │
│   season/{seasonId}            │   season/year)         │
│ tennishq://rankings/atp        │ Rankings → ATP tab     │
│ tennishq://rankings/wta        │ Rankings → WTA tab     │
│ tennishq://search?q={term}     │ Search with pre-filled │
│                                │   query                │
└────────────────────────────────┴────────────────────────┘
```

### Deep Link Back Navigation

When entering via deep link, the back button behavior:

```
Deep Link → Match Detail
  │
  └── [← Back] ► HOME (Tab 1, root)
       (Inserts Home as the root of the stack)

Deep Link → Player Profile
  │
  └── [← Back] ► HOME (Tab 1, root)

Deep Link → Tournament
  │
  └── [← Back] ► HOME (Tab 1, root)

Deep Link → Rankings (ATP/WTA)
  │
  └── Tab bar shows Rankings tab as active
  └── [← Back] ► N/A (already at tab root)
```

**Rule:** Deep links always have Home as the fallback back destination. The tab bar remains visible and functional.

---

## 4. Cross-Screen Navigation Map

```
                    ┌──────────┐
                    │   HOME   │
                    └──┬───┬───┘
            ┌──────────┘   └──────────┐
            ▼                         ▼
     ┌─────────────┐          ┌──────────────┐
     │MATCH DETAIL │◄────────►│  TOURNAMENT  │
     └──┬──────┬───┘          └───┬──────┬───┘
        │      │                  │      │
        ▼      ▼                  ▼      ▼
  ┌──────────┐ │           ┌──────────┐  │
  │ PLAYER   │ │           │ PLAYER   │  │
  │ PROFILE  │◄┘           │ PROFILE  │  │
  └──┬───────┘             └──────────┘  │
     │                                   │
     └──────────► MATCH DETAIL ◄─────────┘
```

**Key insight:** Match Detail, Player Profile, and Tournament form a navigation triangle — users can reach any of these three from any of the others. The cycle is broken by the back button (always returns to the previous screen in the stack).

---

## 5. Tab Persistence Rules

| Scenario | Behavior |
|----------|----------|
| Switch from Home → Rankings → Home | Home preserves scroll position and any pushed screens |
| Switch tabs while on Match Detail (pushed from Home) | Home tab stack preserved with Match Detail on top |
| Double-tap Home tab | Pop entire stack back to Home root, scroll to top |
| Double-tap Rankings tab | Pop to Rankings root, scroll to top, keep current ATP/WTA selection |
| Double-tap Search tab | Pop to Search root, clear search query, show trending |
| App backgrounded and resumed | Preserve full navigation state (all tabs, all stacks) |
| App killed and relaunched | Start fresh at Home tab root |

---

## 6. Loading & Transition States

### Screen Push Transition

```
CURRENT SCREEN                    NEW SCREEN
┌──────────┐                     ┌──────────┐
│          │ ──── 300ms ────►    │          │
│          │   slide-from-right  │          │
│          │                     │          │
└──────────┘                     └──────────┘
```

### Data Loading on Push

```
[Tap player row in Rankings]
  │
  ├── Immediately push Player Profile screen (300ms slide)
  │
  ├── Show skeleton loading state
  │   (Hero skeleton + match row skeletons)
  │
  ├── Fire parallel API calls:
  │   ├── GET /player/{id}
  │   ├── GET /player/{id}/image
  │   └── GET /player/{id}/matches/near
  │
  ├── As each response arrives:
  │   ├── Player data → populate hero (fade in, 200ms)
  │   ├── Image → replace skeleton circle (fade in, 200ms)
  │   └── Matches → populate list (fade in per item, 100ms stagger)
  │
  └── Full screen populated (typically < 500ms total)
```

### Tab Content Loading

```
[Tap Stats tab on Match Detail]
  │
  ├── Tab indicator slides to Stats (200ms)
  │
  ├── If cached: show immediately
  │
  ├── If not cached:
  │   ├── Show skeleton (stat bar skeletons)
  │   ├── Fire GET /match/{id}/statistics
  │   └── Populate on response (fade in)
  │
  └── Cache for session (no re-fetch on tab revisit)
```

---

*Document maintained by Nadal (Frontend + Design Agent). Last updated: 2026-03-16.*
