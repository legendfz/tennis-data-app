# HANDOFF.md — Cross-Agent Coordination

> This file is the shared context for all agents. Read before starting work.

## Current State (Updated: 2026-03-17)

### ✅ COMPLETED
1. **Data Layer** (`packages/api/src/`)
   - Provider abstraction: `providers/base.ts` defines interface
   - TennisApi1 full implementation: `providers/tennisapi.ts`
   - Services with auto-cache: `services/events.ts`, `services/players.ts`, `services/rankings.ts`, `services/tournaments.ts`
   - Factory: `import { createTennisClient } from './tennis/index.js'`
   - Types: `types/events.ts`, `types/players.ts`, `types/rankings.ts`, `types/tournaments.ts`

2. **API Server** (`packages/api/src/index.ts`, port 3001)
   - All routes tested and working:
   ```
   GET /api/health
   GET /api/matches/live
   GET /api/matches/date/:year/:month/:day
   GET /api/matches/:id
   GET /api/matches/:id/statistics
   GET /api/matches/:id/h2h
   GET /api/matches/:id/point-by-point
   GET /api/players/search/:term
   GET /api/players/:id
   GET /api/players/:id/matches?page=0
   GET /api/rankings/atp
   GET /api/rankings/wta
   GET /api/tournaments/:id
   GET /api/tournaments/:id/draw/:seasonId
   ```

3. **Documentation**
   - BRD: `docs/BRD.md`
   - PRD: `docs/PRD.md`
   - UI/UX Design: `docs/UIUX-DESIGN.md`
   - Screen Flows: `docs/SCREEN-FLOWS.md`
   - API Capabilities: `docs/API-CAPABILITIES.md`
   - Decisions: `docs/DECISIONS.md`

### 🚧 IN PROGRESS
4. **React Native App** (`packages/mobile/` — to be created)
   - Expo SDK 52, expo-router for navigation
   - 6 screens: Home, Rankings, Search, Match Detail, Player Profile, Tournament
   - Dark theme, design system from UIUX-DESIGN.md

### ⚠️ CLEANUP NEEDED
- `repo/` directory has partial Expo scaffolding — move useful parts to `packages/mobile/`, delete `repo/`
- `packages/web/` has Next.js components — keep for potential web version later, not MVP priority

## API Response Examples

### /api/matches/live
```json
{
  "data": [
    {
      "id": 15740411,
      "homeTeam": { "name": "Player A", "id": 123, "country": { "alpha2": "US" } },
      "awayTeam": { "name": "Player B", "id": 456, "country": { "alpha2": "ES" } },
      "homeScore": { "current": 2, "period1": 6, "period2": 3, "period3": 5 },
      "awayScore": { "current": 1, "period1": 4, "period2": 6, "period3": 3 },
      "status": { "code": 10, "description": "3rd set", "type": "inprogress" },
      "tournament": { "name": "ATP Miami Open", "id": 123 },
      "startTimestamp": 1773636005
    }
  ]
}
```

### /api/rankings/atp
```json
{
  "data": {
    "rankings": [
      { "ranking": 1, "points": 13550, "team": { "name": "Carlos Alcaraz", "id": 371050 } },
      { "ranking": 2, "points": 11400, "team": { "name": "Jannik Sinner", "id": 216488 } }
    ],
    "type": "atp"
  }
}
```

### /api/players/search/:term
```json
{
  "data": {
    "players": [{ "name": "Jannik Sinner", "id": 216488, "country": { "alpha2": "IT" } }],
    "tournaments": [{ "name": "Sinner Cup", "id": 999 }]
  }
}
```

## For Nadal (Frontend):
- API base URL: `http://localhost:3001`
- All endpoints return `{ data: ... }` wrapper
- Player images: `https://tennisapi1.p.rapidapi.com/api/tennis/player/{id}/image` (needs RapidAPI headers)
- Country flags: `https://tennisapi1.p.rapidapi.com/api/img/flag/{alpha2}` (needs RapidAPI headers)
- Add image proxy route to API server if needed (to avoid exposing RapidAPI key to client)

## For Djokovic (Backend):
- Add image proxy endpoints if Nadal needs them
- Monitor rate limits — free tier is 50 req/day
