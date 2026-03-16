# TennisHQ — Product Requirements Document (PRD)

> Version 1.0 | March 16, 2026 | Author: Federer (PM Agent)

---

## 1. Product Overview

TennisHQ is a React Native (Expo) mobile app for iOS and Android that provides tennis fans with live scores, player profiles, rankings, match statistics, and tournament brackets — all through an avatar-driven, visually rich interface.

**Tech stack:**
- Frontend: React Native (Expo)
- Backend: Node.js + Fastify (data abstraction layer over TennisApi1)
- Data source: TennisApi1 via RapidAPI
- Deployment: Vercel (web) + Railway (API)

**Backend data layer is already built** — the provider abstraction over TennisApi1 is complete. Frontend and API routes are the primary development work.

---

## 2. User Stories

### 2.1 Home Screen — Live Matches & Schedule

| ID | Story | Priority |
|----|-------|----------|
| H-1 | As a user, I want to see all live matches on the home screen so I can quickly check scores | P0 |
| H-2 | As a user, I want to see today's match schedule so I know what's coming up | P0 |
| H-3 | As a user, I want to see player avatars next to each match so I can identify players at a glance | P0 |
| H-4 | As a user, I want to tap a match to see full details | P0 |
| H-5 | As a user, I want to filter matches by category (ATP/WTA/Challenger) | P1 |
| H-6 | As a user, I want to browse matches on other dates | P1 |

### 2.2 Player Profile

| ID | Story | Priority |
|----|-------|----------|
| P-1 | As a user, I want to see a player's profile with large HD avatar and name | P0 |
| P-2 | As a user, I want to see a player's current ranking, country, age, and physical stats | P0 |
| P-3 | As a user, I want to see a player's recent match results | P0 |
| P-4 | As a user, I want to see a player's upcoming matches | P0 |
| P-5 | As a user, I want to see a player's ranking history | P1 |
| P-6 | As a user, I want to see a player's recent tournament results | P1 |
| P-7 | As a user, I want to see a player's playing style (handedness, backhand type) | P0 |

### 2.3 Rankings

| ID | Story | Priority |
|----|-------|----------|
| R-1 | As a user, I want to view ATP rankings with player avatars | P0 |
| R-2 | As a user, I want to view WTA rankings with player avatars | P0 |
| R-3 | As a user, I want to tap a player in rankings to go to their profile | P0 |
| R-4 | As a user, I want to see live ranking changes during tournaments | P1 |
| R-5 | As a user, I want to scroll through at least the top 100 | P0 |

### 2.4 Match Detail

| ID | Story | Priority |
|----|-------|----------|
| M-1 | As a user, I want to see the full score (sets + games) with large player avatars | P0 |
| M-2 | As a user, I want to see match statistics (aces, double faults, serve %, break points) | P0 |
| M-3 | As a user, I want to see point-by-point progression | P1 |
| M-4 | As a user, I want to see H2H record between the two players | P0 |
| M-5 | As a user, I want to see previous H2H matches with scores | P1 |
| M-6 | As a user, I want to see match status (live/completed/upcoming/time) | P0 |
| M-7 | As a user, I want to see the tournament context (which round, which event) | P0 |

### 2.5 Tournament

| ID | Story | Priority |
|----|-------|----------|
| T-1 | As a user, I want to see tournament info (name, dates, venue, surface) | P0 |
| T-2 | As a user, I want to see the tournament draw/bracket with player avatars | P0 |
| T-3 | As a user, I want to navigate the bracket and see match results per round | P0 |
| T-4 | As a user, I want to see today's matches at the tournament | P1 |
| T-5 | As a user, I want to see upcoming matches at the tournament | P1 |
| T-6 | As a user, I want to see tournament schedule by round | P1 |

### 2.6 Search

| ID | Story | Priority |
|----|-------|----------|
| S-1 | As a user, I want to search for players by name | P0 |
| S-2 | As a user, I want to search for tournaments by name | P0 |
| S-3 | As a user, I want to see player avatars in search results | P0 |
| S-4 | As a user, I want search results as I type (debounced) | P1 |

### 2.7 Navigation

| ID | Story | Priority |
|----|-------|----------|
| N-1 | As a user, I want a bottom tab bar to switch between Home, Rankings, and Search | P0 |
| N-2 | As a user, I want smooth back navigation from detail screens | P0 |
| N-3 | As a user, I want pull-to-refresh on live data screens | P0 |

---

## 3. Feature Specifications

### 3.1 Home Screen

**Purpose:** Primary landing screen showing live action and today's schedule.

**Layout:**
- **Top section:** "Live Now" — card list of in-progress matches
  - Each card: Player 1 avatar + name vs Player 2 avatar + name, current score, tournament badge
  - Sorted by tournament importance (Grand Slam → Masters → ATP 250 → Challenger)
- **Bottom section:** "Today's Schedule" — upcoming matches grouped by tournament
  - Each row: Player avatars, names, scheduled time, round info
- **Empty state:** "No live matches right now" with schedule for next matches

**Behavior:**
- Auto-refreshes live scores every 30 seconds
- Pull-to-refresh for manual update
- Tap match → Match Detail screen
- Tap player avatar → Player Profile
- Category filter tabs at top (All / ATP / WTA)

**API Endpoints:**
| Data | Endpoint | Notes |
|------|----------|-------|
| Live matches | `GET /live-matches` → TennisApi1 live events | Real-time scores |
| Today's schedule | `GET /events/date/{date}` → TennisApi1 events by date | Grouped by category |
| Player images | `GET /player/{id}/image` → TennisApi1 player image | Cache aggressively |
| Category filter | `GET /events/category/{id}/date/{date}` | ATP=3, WTA=6 |

---

### 3.2 Player Profile

**Purpose:** Comprehensive player page — the "hero" screen of the app.

**Layout:**
- **Hero section:** Full-width HD player avatar (minimum 200x200 rendered), player name in large bold font (24pt+), country flag, current ranking badge
- **Bio section:** Age, height, weight, handedness, backhand style, turned pro year
- **Stats tabs:**
  - **Overview:** Current ranking, recent form (W/L last 10), recent tournament results
  - **Matches:** Recent results (paginated), upcoming matches
  - **Rankings:** Ranking chart over time

**Design rules (stakeholder mandate):**
- Avatar MUST be large, high-definition, and prominently placed
- Name MUST be in large font — the player's identity is the centerpiece
- Fallback avatar: Initials + country flag background

**API Endpoints:**
| Data | Endpoint | Notes |
|------|----------|-------|
| Player details | `GET /player/{id}` | Name, country, bio data |
| Player image | `GET /player/{id}/image` | HD photo |
| Recent matches | `GET /player/{id}/matches/previous` | Paginated |
| Upcoming matches | `GET /player/{id}/matches/upcoming` | Paginated |
| Near matches | `GET /player/{id}/matches/near` | Recent + upcoming combined |
| Ranking history | `GET /player/{id}/rankings` | Historical ranking data |
| Recent tournaments | `GET /player/{id}/tournaments` | Season tournament results |
| Country flag | `GET /flag/{countryCode}` | SVG/PNG flag |

---

### 3.3 Rankings Page

**Purpose:** ATP and WTA rankings in a scannable, avatar-forward list.

**Layout:**
- **Toggle tabs:** ATP / WTA at top
- **List:** Ranked list of players
  - Each row: Rank number, player avatar (48x48 min), player name (large), country flag, points
  - Rank change indicator (↑ green / ↓ red / — gray)
- **Live rankings badge:** When available during tournaments, show "LIVE" indicator

**Behavior:**
- Infinite scroll or pagination (load 50 at a time, up to 100 for free tier)
- Tap player → Player Profile
- Pull-to-refresh

**API Endpoints:**
| Data | Endpoint | Notes |
|------|----------|-------|
| ATP rankings | `GET /rankings/atp` | Top 500 |
| WTA rankings | `GET /rankings/wta` | Top 500 |
| Live ATP rankings | `GET /rankings/atp/live` | During tournaments |
| Live WTA rankings | `GET /rankings/wta/live` | During tournaments |
| Player images | `GET /player/{id}/image` | Batch-fetch for visible rows |

---

### 3.4 Match Detail Page

**Purpose:** Deep dive into a single match — score, stats, H2H, point-by-point.

**Layout:**
- **Header:** Player 1 (avatar + name + flag) vs Player 2 (avatar + name + flag)
  - Large avatars (80x80 min), names in bold
  - Live score or final score prominently displayed
  - Match status badge (LIVE / FINISHED / UPCOMING / time)
- **Tournament context:** Tournament name, round, surface
- **Tabs:**
  - **Score:** Set-by-set scores, current game score if live
  - **Stats:** Two-column comparison (aces, DFs, 1st serve %, break points, etc.)
  - **H2H:** Career head-to-head record, list of previous meetings with scores
  - **Point-by-Point:** Chronological point log (P1 if available)

**API Endpoints:**
| Data | Endpoint | Notes |
|------|----------|-------|
| Match details | `GET /match/{id}` | Players, score, status, tournament |
| Match statistics | `GET /match/{id}/statistics` | Serve %, aces, etc. |
| H2H data | `GET /h2h/{player1Id}/{player2Id}` | Career record + matches |
| Point-by-point | `GET /match/{id}/point-by-point` | Chronological play-by-play |
| Player images | `GET /player/{id}/image` | Both players |
| Match streaks | `GET /match/{id}/streaks` | Recent form |

---

### 3.5 Tournament Page

**Purpose:** Tournament hub — info, bracket, schedule.

**Layout:**
- **Header:** Tournament logo (light/dark variant), name, dates, venue, surface, category
- **Tabs:**
  - **Draw/Bracket:** Visual bracket tree with player avatars
    - **Design rule:** Each player node shows avatar prominently — bracket must be readable by avatar alone, without reading names
    - Tap a match node → Match Detail
    - Tap a player avatar → Player Profile
    - Navigate by round (R128 → R64 → R32 → R16 → QF → SF → F)
  - **Schedule:** Today's matches at this tournament, upcoming matches
  - **Results:** Completed matches, grouped by round

**Bracket UX specifics:**
- Horizontal scrollable bracket (left to right progression)
- Each player node: 40x40 avatar minimum, winner highlighted
- Completed matches show score, upcoming show scheduled time
- Pinch-to-zoom for full bracket overview
- Round selector for quick navigation

**API Endpoints:**
| Data | Endpoint | Notes |
|------|----------|-------|
| Tournament details | `GET /tournament/{id}` | Name, venue, surface, dates |
| Tournament seasons | `GET /tournament/{id}/seasons` | For historical archive |
| Tournament season info | `GET /tournament/{id}/season/{seasonId}` | Specific year info |
| Draw/bracket | `GET /tournament/{id}/season/{seasonId}/draw` | Cup tree structure |
| Rounds | `GET /tournament/{id}/season/{seasonId}/rounds` | Round metadata |
| Matches by round | `GET /tournament/{id}/season/{seasonId}/round/{roundId}/matches` | Round matches |
| Today's matches | `GET /tournament/{id}/season/{seasonId}/matches/date/{date}` | Today's schedule |
| Upcoming matches | `GET /tournament/{id}/season/{seasonId}/matches/upcoming` | Future matches |
| Last matches | `GET /tournament/{id}/season/{seasonId}/matches/last` | Recent results |
| Tournament logo | `GET /tournament/{id}/logo` | Light + dark variants |
| Player images | `GET /player/{id}/image` | For bracket avatars |

---

### 3.6 Search

**Purpose:** Find players and tournaments quickly.

**Layout:**
- **Search bar:** Full-width at top, auto-focus on screen entry
- **Results:** Mixed list — players and tournaments in separate sections
  - Player results: Avatar (48x48), name, country flag, ranking
  - Tournament results: Logo, name, category, dates
- **Empty state:** Trending players or upcoming tournaments as suggestions

**Behavior:**
- Debounced search (300ms delay after typing stops)
- Minimum 2 characters to trigger search
- Tap player → Player Profile
- Tap tournament → Tournament Page

**API Endpoints:**
| Data | Endpoint | Notes |
|------|----------|-------|
| Search | `GET /search/{term}` | Returns players + tournaments |
| Player images | `GET /player/{id}/image` | For result avatars |
| Tournament logos | `GET /tournament/{id}/logo` | For result icons |

---

### 3.7 Navigation Structure

**Bottom Tab Bar (3 tabs):**

```
┌─────────────────────────────────────┐
│                                     │
│          [Screen Content]           │
│                                     │
├───────────┬───────────┬─────────────┤
│  🏠 Home  │ 📊 Rankings │ 🔍 Search │
└───────────┴───────────┴─────────────┘
```

**Navigation Stack:**

```
Home Tab
  └── Match Detail
       └── Player Profile
       └── Tournament Page
            └── Match Detail

Rankings Tab
  └── Player Profile
       └── Match Detail

Search Tab
  └── Player Profile
  └── Tournament Page
```

Each tab maintains its own navigation stack. Deep links supported for match/player/tournament IDs.

---

## 4. Information Architecture

```
TennisHQ App
│
├── Home (Tab 1 — default)
│   ├── Live Matches Section
│   │   └── → Match Detail
│   └── Today's Schedule Section
│       └── → Match Detail
│
├── Rankings (Tab 2)
│   ├── ATP Rankings List
│   │   └── → Player Profile
│   └── WTA Rankings List
│       └── → Player Profile
│
├── Search (Tab 3)
│   ├── Player Results
│   │   └── → Player Profile
│   └── Tournament Results
│       └── → Tournament Page
│
├── Player Profile (Stack Screen)
│   ├── Overview (default tab)
│   ├── Matches (tab)
│   │   └── → Match Detail
│   └── Rankings (tab)
│
├── Match Detail (Stack Screen)
│   ├── Score (default tab)
│   ├── Stats (tab)
│   ├── H2H (tab)
│   │   └── → Previous Match Detail
│   └── Point-by-Point (tab)
│
└── Tournament Page (Stack Screen)
    ├── Draw/Bracket (default tab)
    │   └── → Match Detail
    │   └── → Player Profile
    ├── Schedule (tab)
    │   └── → Match Detail
    └── Results (tab)
        └── → Match Detail
```

---

## 5. Data Requirements Per Screen

| Screen | API Calls (on load) | Refresh Strategy | Cache Duration |
|--------|---------------------|------------------|----------------|
| Home | Live matches + Events by date + Player images | Auto 30s (live), pull-to-refresh | Live: 30s, Schedule: 5min |
| Player Profile | Player details + Image + Near matches | Pull-to-refresh | 15 min |
| Rankings | ATP or WTA rankings + Player images | Pull-to-refresh | 30 min (live: 5 min) |
| Match Detail | Match details + Stats + H2H + Player images | Auto 15s if live, pull-to-refresh | Live: 15s, Completed: 1hr |
| Tournament | Tournament details + Draw + Logo + Player images | Pull-to-refresh | 15 min |
| Search | Search endpoint + Images | On input (debounced) | 5 min |

### API Rate Limit Budget

TennisApi1 plan allows ~1000 requests/day on free tier, more on paid.

**Optimization strategies:**
1. **Image caching:** Cache all player/tournament images locally after first fetch
2. **Batch loading:** Pre-fetch player images for visible list items only
3. **Smart polling:** Live match refresh only when app is foregrounded
4. **Server-side caching:** Fastify backend caches API responses with appropriate TTL
5. **Stale-while-revalidate:** Show cached data immediately, refresh in background

---

## 6. Non-Functional Requirements

### 6.1 Performance
| Metric | Target |
|--------|--------|
| App launch to interactive | < 2 seconds |
| Screen transition | < 300ms |
| Live score update latency | < 5 seconds from source |
| API response time (backend, p95) | < 500ms |
| Search results display | < 500ms from last keystroke |
| Image load (cached) | < 100ms |
| Image load (network) | < 1 second |

### 6.2 Offline Behavior
- Show last-cached data when offline with "Offline" banner
- Queue refresh requests for when connection restores
- Player images available offline once cached
- No crash or blank screens on connection loss

### 6.3 Accessibility
- Minimum touch target: 44x44pt (iOS HIG)
- Color contrast: WCAG AA (4.5:1 text, 3:1 large text)
- Screen reader labels on all interactive elements
- Support dynamic type / font scaling
- No information conveyed by color alone (use icons + text)

### 6.4 Platform Support
- iOS 15+ (Expo managed workflow)
- Android 10+ (API 29+)
- Screen sizes: iPhone SE (375pt) to iPad (if natural), Android phones 360dp+

### 6.5 Security & Privacy
- No user data collected in MVP (no accounts)
- API keys stored server-side only (never in client bundle)
- HTTPS everywhere
- No analytics SDK in MVP (add post-MVP)

---

## 7. MVP Scope Boundary

### ✅ IN SCOPE (MVP)
- Live match scores with auto-refresh
- Today's match schedule with date browsing
- Player profile (bio, avatar, recent matches, upcoming matches, ranking)
- ATP + WTA rankings (top 100 displayed, top 500 available)
- Match detail (score, statistics, H2H record, point-by-point)
- Tournament page (info, draw/bracket, schedule)
- Search (players + tournaments)
- Bottom tab navigation (Home, Rankings, Search)
- Image caching
- Pull-to-refresh on all screens
- Category filtering (ATP/WTA) on home screen
- Server-side caching layer

### ❌ OUT OF SCOPE (Post-MVP)
- User accounts / authentication
- Favorites / follow players
- Push notifications
- Historical bracket archive (browsing past tournament draws)
- Real-time win probability model
- Detailed career stats by surface (requires Matchstat API)
- Betting odds display
- News / articles feed
- Social sharing
- Dark mode (nice-to-have, defer)
- Tablet-optimized layout
- Localization / i18n
- In-app purchases / subscription paywall
- Analytics / tracking SDK
- Doubles-specific features

---

## 8. Post-MVP Roadmap

### Phase 2: Engagement (Weeks 4-6)
- User accounts + authentication
- Favorite players + tournaments
- Push notifications (match start, score alerts, player matches)
- Dark mode
- Historical bracket archive (browse Grand Slam draws 2010-present)

### Phase 3: Premium (Weeks 7-10)
- Subscription paywall (RevenueCat integration)
- Premium features: full rankings, advanced stats, historical brackets
- Real-time win probability analysis (Markov chain / Monte Carlo model)
- Deep H2H analytics (by surface, by tournament, by year)
- Player comparison tool

### Phase 4: Growth (Months 3-6)
- App Store + Google Play public launch
- Analytics + crash reporting (Sentry + Amplitude)
- Performance optimization pass
- Tablet-optimized layout
- Social sharing (match scores, bracket screenshots)
- Matchstat API integration (career stats by surface)
- Widget support (iOS + Android)

### Phase 5: Scale (Months 6-12)
- Localization (Spanish, French, Chinese, Japanese)
- Community features (predictions, polls)
- Content partnerships (news feeds, video highlights)
- Doubles deep integration
- Apple Watch / Wear OS companion

---

*Document maintained by Federer (PM Agent). Last updated: 2026-03-16.*
