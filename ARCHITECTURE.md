# TennisHQ — Multi-Agent Architecture

## Product Vision
Tennis data app — 网球版 FotMob。球员档案、比赛实时数据、H2H 对战、赛事追踪。

## Agent Team (7 agents)

| Agent | Role | Emoji | Model | Heartbeat |
|-------|------|-------|-------|-----------|
| Federer | Boss/PM | 🎾 | Sonnet | every 10min |
| Djokovic | Backend Dev | 💻 | Sonnet | every 10min (+1m) |
| Nadal | Frontend Dev | 📱 | Sonnet | every 10min (+2m) |
| Murray | Data Engineer | 📊 | Sonnet | every 10min (+3m) |
| Osaka | Researcher | 🔍 | Sonnet | every 10min (+4m) |
| Serena | Designer/UX | 🎨 | Sonnet | every 10min (+5m) |
| McEnroe | QA/Devil's Advocate | 🗡️ | Sonnet | every 10min (+6m) |

## Task Flow
```
backlog → todo → in_progress → peer_review → review → done
```

- Boss (Federer) creates tasks from goals, coordinates
- Only Boss promotes peer_review → review
- Only human (Boss/你) marks done
- Peer review: same-goal agents must all approve

## Tech Stack
- **Backend:** Node.js + Express/Fastify
- **Database:** PostgreSQL (structured match/player data) + PocketBase (task management)
- **Frontend:** React Native (mobile) or Next.js (web-first MVP)
- **Data Sources:** Tennis API (SportRadar, API-Tennis, or similar)
- **Infra:** Docker, all runs in container

## PocketBase Schema (Task Management)

### agents
- id, name, role, emoji, status (working/idle), last_heartbeat

### goals
- id, title, description, assigned_agents[], tasks_per_day, status

### tasks
- id, goal_id, title, description, status, assigned_to, priority, created_by, created_at, updated_at

### comments
- id, task_id, agent_name, content, type (feedback/approval/question/blocker), created_at

### documents
- id, task_id, title, content, version, created_by, created_at

### activity
- id, agent_name, action, task_id, details, created_at

## Development Rules

### Code Rules (铁律)
1. **所有代码必须通过 Claude Code 编写** — agent 不直接写文件，调用 `claude -p "task description" --dangerously-skip-permissions` 执行
2. **所有代码必须 commit 到 GitHub** — 每完成一个任务，commit + push
3. **GitHub Repo:** (待创建)
4. **Branch 策略:** 
   - `main` — 稳定版本，只通过 PR 合并
   - `feat/<task-id>-<description>` — 功能分支，每个任务一个分支
   - Agent 完成任务后提 PR，peer review 通过后合并

### Agent 写代码流程
```
1. Agent 领取任务
2. git checkout -b feat/<task-id>-<description>
3. claude -p "<具体编码任务，包含上下文和要求>" --dangerously-skip-permissions
4. git add . && git commit -m "<task-id>: <description>"
5. git push origin feat/<task-id>-<description>
6. 提交到 peer_review
7. Review 通过后 merge to main
```

## Initial Goals

### Goal 1: Foundation (Week 1)
- Research tennis data APIs, pricing, coverage
- Design database schema for players, matches, tournaments
- Set up project scaffolding (backend + frontend)
- Design core UI wireframes

### Goal 2: Player Profiles (Week 2)
- Build player data ingestion pipeline
- Player profile API endpoints
- Player profile UI (stats, bio, ranking history)

### Goal 3: Match Data (Week 3)
- Match data ingestion (live + historical)
- Match detail API + UI
- Live score updates

### Goal 4: H2H & Analytics (Week 4)
- Head-to-head comparison engine
- Surface-specific stats
- Serve/return analytics
- H2H UI component
