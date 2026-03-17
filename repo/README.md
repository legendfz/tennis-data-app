# 🎾 TennisHQ

Your Tennis Command Center — a full-stack mobile app for tracking professional tennis players, matches, tournaments, and bracket draws.

![TennisHQ](https://img.shields.io/badge/version-1.0.0-green) ![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue) ![License](https://img.shields.io/badge/license-MIT-gray)

## 📸 Screenshots

| Home | Players | Matches | Tournament Bracket |
|------|---------|---------|-------------------|
| *screenshot* | *screenshot* | *screenshot* | *screenshot* |

## ✨ Features

- **Player Profiles** — Rankings, stats, win/loss records, ranking history charts
- **Match Tracker** — Browse matches with detailed stats (aces, serve %, break points)
- **Tournament Brackets** — Visual bracket display with champion highlights and year selector
- **Surface Filtering** — Filter by Hard, Clay, Grass courts
- **Pull-to-Refresh** — All lists support pull-to-refresh
- **Dark Theme** — Beautiful dark UI optimized for mobile
- **Push Notifications** — Infrastructure ready (expo-notifications)

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Mobile App** | React Native + Expo (SDK 52) |
| **Navigation** | Expo Router (file-based) |
| **State** | TanStack React Query |
| **HTTP** | Axios |
| **Backend** | Express.js + TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Deployment** | Docker + Docker Compose |
| **Build** | EAS Build (Expo Application Services) |

## 📁 Project Structure

```
tennishq/
├── app/                    # Expo mobile app
│   ├── app/               # Screens (file-based routing)
│   │   ├── (tabs)/        # Tab screens (Home, Players, Matches, Tournaments)
│   │   ├── player/[id]    # Player detail
│   │   ├── match/[id]     # Match detail
│   │   └── tournament/[id] # Tournament bracket & results
│   ├── lib/               # Utilities (API, avatars, notifications)
│   └── assets/            # Icons, splash screen
├── server/                # Express API server
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── data/          # JSON data files
│   │   └── mock-data.ts   # Data loader
│   └── prisma/            # Database schema
├── shared/                # Shared TypeScript types
├── docker-compose.yml     # Docker deployment
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+
- **npm** 9+
- **Expo CLI**: `npm install -g expo-cli`
- **Docker** (for database, optional)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/tennishq.git
cd tennishq

# Install server dependencies
cd server && npm install && cd ..

# Install app dependencies
cd app && npm install && cd ..
```

### 2. Start the Backend

```bash
cd server
cp .env.example .env  # Edit DATABASE_URL if needed
npm run dev
```

Server runs at `http://localhost:3001`. Health check: `GET /api/health`

### 3. Start the Mobile App

```bash
cd app
npm start
```

Scan QR code with Expo Go (iOS/Android) or press `i`/`a` for simulators.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/players` | List players (search, sort, pagination) |
| GET | `/api/players/:id` | Player detail + stats |
| GET | `/api/matches` | List matches (filter by tournament/player) |
| GET | `/api/matches/:id` | Match detail + stats |
| GET | `/api/tournaments` | List tournaments |
| GET | `/api/tournaments/:id` | Tournament detail + matches |
| GET | `/api/tournaments/:id/draw` | Tournament bracket data |

## 🐳 Deployment

### Docker Compose (Recommended)

```bash
# Start server + PostgreSQL
docker-compose up -d

# Run database migrations
docker-compose exec server npx prisma migrate deploy
```

### Manual Deploy

1. Build the server: `cd server && npm run build`
2. Set `DATABASE_URL` environment variable
3. Run migrations: `npx prisma migrate deploy`
4. Start: `npm start`

### Mobile App Build (EAS)

```bash
cd app

# Install EAS CLI
npm install -g eas-cli

# Build for preview (internal distribution)
eas build --profile preview --platform all

# Build for production
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## 🔧 Configuration

### Environment Variables (Server)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `NODE_ENV` | `development` | Environment |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |

### Environment Variables (App)

| Variable | Default | Description |
|----------|---------|-------------|
| `EXPO_PUBLIC_API_URL` | `http://localhost:3001` | Backend API URL |

## 📝 License

MIT
