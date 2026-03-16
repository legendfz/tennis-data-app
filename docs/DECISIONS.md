# DECISIONS.md — TennisHQ Project Decisions

> **⚠️ ALL sessions MUST read this file before making changes.**
> **⚠️ ALL sessions MUST write decisions here so every bot stays in sync.**

---

## Architecture

- **Agent team:** 3 agents (was 7)
  - **Federer** — PM + QA
  - **Djokovic** — Backend + Data
  - **Nadal** — Frontend + Design
- **Task management:** GitHub Issues (no PocketBase)
- **Frontend:** React Native (Expo) — real iOS + Android app
- **Backend:** Node.js + Fastify
- **Data layer:** Provider abstraction over RapidAPI (built ✅)
- **Deployment:** Vercel (web) + Railway (API)

## Data Sources (RapidAPI)

- **Primary:** TennisApi1 (`tennisapi1.p.rapidapi.com`) — live scores, rankings, events, H2H, player data
- **Secondary:** Matchstat ATP/WTA/ITF — deep stats (stub)
- **Tertiary:** Ultimate Tennis — highlights, odds (stub)
- **API Key:** stored in `.env`

## Timeline

- **Target:** 3 weeks for MVP
- **Week 1:** Project setup + data API + player data
- **Week 2:** Player profiles UI + match data + live scores
- **Week 3:** Tournament bracket (with history) + polish

## Product Features (MVP)

1. Live scores
2. Player profiles (big name + HD avatar — design rule)
3. ATP/WTA rankings
4. Match details + statistics
5. Tournament bracket (light看头像就能认人)
6. H2H history
7. Search players & tournaments

## Post-MVP

- Real-time win probability analysis (Markov chain / Monte Carlo)
- Historical bracket archive (e.g. every US Open bracket since 2010)
- Push notifications
- User accounts + favorites
- Subscription monetization (free + paid tier)

## Design Rules

- Player names: large font, always visible
- Player avatars: HD, prominent placement
- Tournament brackets: identifiable by avatar alone — no need to read names
- Historical brackets: users can browse past years

## Business Model

- Free tier + paid subscription
- Details TBD

## Reporting

- Daily progress report at **11:00 AM PST** to friend bot (Telegram 8780435073)

---

## Decision Log

| Date | Decision | Source |
|------|----------|--------|
| 2026-03-16 | 7 agents → 3 agents | Z (friend bot) |
| 2026-03-16 | Kill PocketBase, use GitHub Issues | Z (friend bot) |
| 2026-03-16 | Frontend = React Native (Expo) | Z (friend bot) |
| 2026-03-16 | Add monetization strategy | Z (friend bot) |
| 2026-03-16 | Compress timeline to 3 weeks | Z (friend bot) |
| 2026-03-16 | Add real-time win probability (post-MVP) | Z (friend bot) |
| 2026-03-16 | Add historical bracket archive | Z (friend bot) |
| 2026-03-16 | Design: avatars must be large + HD | Z (friend bot) |
| 2026-03-16 | Design: bracket readable by avatar alone | Z (friend bot) |
| 2026-03-16 | Daily 11AM PST report to friend bot | Z (friend bot) |
| 2026-03-16 | Data layer built with TennisApi1 provider | Boss (main bot) |
| 2026-03-16 | Subscribe all 3 RapidAPI tennis APIs | Boss (main bot) |
