# TennisHQ — API Data Capabilities

> What data can we actually show users? Based on TennisApi1 OpenAPI spec (70+ endpoints).

## Live Data
- **Live matches** — all currently in-progress matches, real-time score updates
- **Point-by-point** — chronological play-by-play for live/completed matches
- **Power graph** — momentum visualization data per match
- **Match streaks** — recent form for each player

## Match/Event Data
- Events by date (all matches on a given day)
- Events by category (ATP, WTA, ITF, Challenger) + date
- Match details (players, score, status, tournament, venue)
- Match statistics (serve %, break points, aces, etc.)
- Match highlights (video links when available)
- Match betting odds (multiple providers)
- Fan votes / predictions

## Player Data
- Player details (name, country, age, height, weight, handedness, backhand style, turned pro year)
- Player image (profile photo)
- Player rankings (current + historical)
- Player previous matches (paginated)
- Player upcoming matches (paginated)
- Player near matches (recent + upcoming combined)
- Player recent tournaments
- Player standings by season

## Team/Doubles Data
- Team details, image, rankings
- Team previous/upcoming/near matches
- Team season stats
- Team season best results

## Tournament Data
- Tournament details + metadata
- Tournament seasons (historical)
- Tournament season info
- Tournament rounds
- Tournament draw/bracket (cup trees)
- Tournament standings
- Tournament matches by date
- Tournament matches by round
- Tournament last matches
- Tournament upcoming matches
- Tournament venues + venue events
- Tournament media
- Tournament logo (light + dark)
- Monthly calendar (tournaments by month)
- Daily categories (which categories have events today)
- Categories with events by month

## Rankings
- ATP rankings (top 500)
- WTA rankings (top 500)
- Live ATP rankings (real-time during tournaments)
- Live WTA rankings (real-time during tournaments)

## Search
- Search players and tournaments by term (paginated)

## Assets
- Country flags (by code)
- Player images
- Team images
- Tournament logos (light + dark variants)
- Placeholder images (player, team, tournament, manager)

## What We CANNOT Get (from current APIs)
- Detailed career statistics by surface (need Matchstat API)
- News/articles (need Ultimate Tennis API or scraping)
- Social media feeds
- Injury reports
- Prize money breakdowns by tournament
- Court-level tracking data (Hawk-Eye style)
- Video highlights for all matches (limited availability)
