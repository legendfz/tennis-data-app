# TennisHQ — Business Requirements Document (BRD)

> Version 1.0 | March 16, 2026 | Author: Federer (PM Agent)

---

## 1. Executive Summary

TennisHQ is a mobile-first tennis data application — think "FotMob for tennis." It delivers live scores, player profiles, rankings, match statistics, and tournament brackets in a visually-driven, avatar-centric UI that no current competitor matches.

The MVP targets tennis fans who want a dedicated, modern app for following the sport — not a generic sports app that treats tennis as an afterthought. The app launches on iOS and Android via React Native (Expo), backed by a Node.js/Fastify API layer consuming TennisApi1 data.

**Timeline:** 3 weeks to commercial demo quality.  
**Business model:** Freemium — free tier for core features, paid subscription for advanced analytics and premium data.

---

## 2. Business Objectives

### 2.1 Why This App

The tennis data market has a gap:
- **Generic sports apps** (Sofascore, Flashscore) cover tennis but treat it as one of 30+ sports. The UX is functional, not delightful.
- **ATP/WTA official apps** are slow, bloated, and limited to their respective tours.
- **Google scores** are shallow — no brackets, no stats depth, no player profiles.
- **Tennis Abstract** has great data but zero UX. Desktop-only, looks like 2005.

No app currently combines **modern mobile UX + tennis-specific depth + visual bracket experience + real-time analytics** (post-MVP).

### 2.2 Market Opportunity

- **Tennis audience:** ~1 billion fans globally (ITF estimate), 87M+ in the US alone
- **Grand Slam viewership:** 2024 US Open drew 27.5M viewers (ESPN)
- **Mobile-first:** 70%+ of sports content consumption is on mobile
- **Underserved niche:** Tennis fans have no equivalent of FotMob (football), ESPN (US sports), or The Score
- **Willingness to pay:** Tennis demographics skew affluent — higher conversion potential for subscriptions

### 2.3 Core Value Proposition

> **"The only tennis app where you can identify every player in a bracket just by their avatar."**

Visual identity, speed, and depth. Not another text-heavy score ticker.

---

## 3. Target Users

### Persona 1: The Daily Follower — "Alex"
- **Profile:** 25-40, follows ATP/WTA tours weekly
- **Behavior:** Checks live scores during work, browses rankings Monday morning, watches Grand Slams live
- **Needs:** Fast live scores, clean schedule view, player profiles to settle arguments
- **Pain:** Sofascore is cluttered with other sports; ATP app is slow
- **Value:** Free tier is enough — retention driver

### Persona 2: The Stats Enthusiast — "Jordan"
- **Profile:** 30-50, tennis nerd, may play recreationally
- **Behavior:** Dives into H2H records, analyzes match stats, browses historical brackets
- **Needs:** Deep match statistics, H2H data, point-by-point, historical bracket archives
- **Pain:** Tennis Abstract has data but terrible UX; no mobile option
- **Value:** Paid subscriber — will pay for depth

### Persona 3: The Grand Slam Tourist — "Sam"
- **Profile:** 20-55, watches only Grand Slams and Masters events
- **Behavior:** 4-6 weeks per year of intense engagement, dormant otherwise
- **Needs:** Tournament brackets, match schedule, who's playing who
- **Pain:** Google gives basic scores; can't navigate a draw easily on phone
- **Value:** Free user, potential premium convert during Slams

---

## 4. Competitive Analysis

| Feature | TennisHQ (MVP) | ATP/WTA Apps | Flashscore | Sofascore | Google Scores |
|---------|----------------|--------------|------------|-----------|---------------|
| Live scores | ✅ | ✅ | ✅ | ✅ | ✅ |
| Player profiles | ✅ (HD avatar focus) | ✅ (basic) | ❌ | ✅ (generic) | ❌ |
| Rankings (ATP+WTA) | ✅ unified | ❌ (separate apps) | ✅ | ✅ | ✅ (basic) |
| Match statistics | ✅ | ✅ | ✅ (limited) | ✅ | ❌ |
| Point-by-point | ✅ | ❌ | ❌ | ✅ | ❌ |
| Tournament bracket | ✅ (avatar-driven) | ✅ (text-heavy) | ❌ | ✅ (basic) | ❌ |
| Historical brackets | 🔜 Post-MVP | ❌ | ❌ | ❌ | ❌ |
| H2H data | ✅ | ✅ (limited) | ❌ | ✅ | ❌ |
| Tennis-only focus | ✅ | ✅ | ❌ | ❌ | ❌ |
| Modern mobile UX | ✅ | ❌ (slow/bloated) | ✅ | ✅ | N/A |
| Real-time win probability | 🔜 Post-MVP | ❌ | ❌ | ❌ | ❌ |

### Competitive Moat (Post-MVP)
1. **Avatar-driven visual design** — unique in category
2. **Real-time win probability** — no competitor offers this
3. **Historical bracket archive** — browse any Grand Slam draw back to 2010+
4. **Tennis-only focus** = faster iteration on tennis-specific UX

---

## 5. Business Model

### 5.1 Free Tier
- Live scores and today's schedule
- Player profiles (basic info + current ranking)
- ATP/WTA rankings (top 100)
- Match scores and basic stats
- Tournament brackets (current events)
- Search players and tournaments

### 5.2 Premium Subscription (Post-MVP launch)
- **Price target:** $4.99/month or $39.99/year
- Full rankings (top 500)
- Detailed match statistics + point-by-point
- H2H deep analysis
- Historical bracket archive
- Real-time win probability (when available)
- Ad-free experience
- Player form/streak analytics

### 5.3 Revenue Projections (Conservative)
| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Downloads | 5K | 25K | 100K |
| DAU | 500 | 3K | 15K |
| Paid subscribers | 50 | 500 | 3K |
| MRR | $250 | $2,500 | $15,000 |

*Projections assume organic growth + App Store optimization. No paid acquisition budget assumed.*

---

## 6. Success Metrics (KPIs)

### MVP Phase (Weeks 1-3)
| KPI | Target |
|-----|--------|
| Core screens complete | 6/6 (Home, Player, Rankings, Match, Tournament, Search) |
| API response time (p95) | < 500ms |
| App crash rate | < 1% |
| Demo readiness | Fully functional demo on device |

### Launch Phase (Months 1-3)
| KPI | Target |
|-----|--------|
| App Store rating | ≥ 4.3 stars |
| Day 1 retention | ≥ 40% |
| Day 7 retention | ≥ 20% |
| Average session length | ≥ 3 minutes |
| DAU/MAU ratio | ≥ 25% |

### Growth Phase (Months 3-12)
| KPI | Target |
|-----|--------|
| Monthly downloads | 10K+ |
| Free → paid conversion | ≥ 3% |
| Monthly churn (paid) | < 8% |
| NPS | ≥ 50 |

---

## 7. Constraints and Assumptions

### Constraints
1. **3-week timeline** — must ship demo-quality MVP, not production-ready
2. **3-person agent team** — Federer (PM), Djokovic (backend), Nadal (frontend)
3. **Data dependency** — limited to TennisApi1 capabilities; no custom data collection
4. **No user system in MVP** — no accounts, no favorites, no personalization
5. **No push notifications in MVP** — requires user system
6. **Budget:** RapidAPI subscription costs only (~$50-100/month for API access)
7. **No App Store submission in MVP** — TestFlight/APK distribution only

### Assumptions
1. TennisApi1 provides reliable uptime (>99%) during development
2. Player images from API are sufficient quality for HD avatar requirement
3. React Native (Expo) can deliver native-feel performance for live data
4. Tournament bracket data (cup trees) from API maps cleanly to visual bracket UI
5. Users will accept a tennis-only app (not multi-sport) if the UX is superior
6. Grand Slam periods will drive organic discovery and downloads
7. Post-MVP features (win probability, historical brackets) are technically feasible with available data

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| API rate limits during live events | High | Implement caching layer + smart polling intervals |
| Player images low quality | Medium | Fallback to initials + country flag avatar |
| Tournament bracket data incomplete | High | Test with current live tournament data early in Week 1 |
| 3-week timeline too aggressive | Medium | Strict P0/P1/P2 prioritization; cut P2 features if needed |
| React Native performance for live updates | Medium | Use efficient diff-based state updates; benchmark early |

---

*Document maintained by Federer (PM Agent). Last updated: 2026-03-16.*
