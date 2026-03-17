# 🎾 TennisHQ

Your Tennis Command Center — track players, matches, and tournaments.

## Project Structure

```
/repo
  /app          — React Native (Expo) frontend
  /server       — Node.js (Express + TypeScript) backend
  /shared       — Shared TypeScript type definitions
```

## Tech Stack

**Frontend:**
- React Native with Expo (managed workflow)
- Expo Router for navigation
- TanStack React Query for data fetching
- Axios for HTTP client

**Backend:**
- Express.js with TypeScript
- Prisma ORM for database
- PostgreSQL

## Getting Started

### Backend
```bash
cd server
npm install
npm run dev
```
Server runs on `http://localhost:3001`

### Frontend
```bash
cd app
npm install
npm run start
```

### API Endpoints
- `GET /api/players` — List all players
- `GET /api/players/:id` — Get player by ID
- `GET /api/matches` — List all matches
- `GET /api/matches/:id` — Get match by ID
- `GET /api/tournaments` — List all tournaments
- `GET /api/tournaments/:id` — Get tournament by ID
- `GET /api/health` — Health check

## Database Schema
- **Players** — ATP player profiles with ranking, stats
- **Tournaments** — Grand Slams and tour events
- **Matches** — Match results with scores and stats
- **Tournament Draws** — Draw brackets

## Development

Currently using mock data. PostgreSQL integration via Prisma is scaffolded and ready for connection.
