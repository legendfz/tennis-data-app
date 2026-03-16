# TennisHQ — Architecture

## Product Vision
网球版 FotMob。球员档案、比赛实时数据、H2H 对战、赛事追踪、实时胜率分析。

## 商业模式（待验证）
- **免费层：** 基础比分、球员档案、签表
- **付费订阅：** 实时胜率分析、深度 H2H、历史数据、无广告
- **目标：** 先做产品获取用户，再通过订阅变现

## 竞品差异化
- Sofascore/FlashScore：覆盖全运动，网球体验一般
- Tennis Abstract：数据强但 UI 丑、纯桌面
- **TennisHQ 定位：** 网球专精 + 现代 UI + 实时胜率（独家功能）+ 头像驱动的视觉体验

## Agent Team (3 agents)

| Agent | Role | Emoji | Model |
|-------|------|-------|-------|
| Federer | PM + QA | 🎾 | Sonnet |
| Djokovic | Backend + Data | 💻 | Sonnet |
| Nadal | Frontend + Design | 📱 | Sonnet |

- Federer：分配任务、review 代码、质量把关
- Djokovic：API、数据库、数据采集管线
- Nadal：UI、交互、设计实现

## Task Flow
```
backlog → todo → in_progress → review → done
```
- Federer 分配任务、做 review
- 人（Boss/Z）确认 done

## Tech Stack
- **Frontend:** React Native (Expo) — iOS + Android app
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Task Management:** GitHub Issues（不再用 PocketBase）
- **Data Sources:** Tennis API（待选型，见下方）
- **部署:** App Store + Google Play（前端）+ Railway/Fly.io（后端）
- **Infra:** Docker for local dev

## 数据 API 选型（需确认）
| API | 实时数据 | 历史数据 | 价格 | 备注 |
|-----|---------|---------|------|------|
| SportRadar | ✅ | ✅ | $$$ | 最全，贵 |
| API-Tennis | ✅ | ✅ | $$ | 性价比高 |
| Tennis Live Data | ✅ | ❌ | $ | 便宜但有限 |
| 免费爬虫 | ❌ | ✅ | 免费 | 法律风险 |

**决策：Week 1 先试 API-Tennis，不行再换。**

## UI/UX 设计原则
- **球员名字和头像必须清晰突出** — 大字体、高清头像、一眼能认出是谁
- **Tournament bracket 仅靠头像就能分辨** — 头像尺寸足够大、辨识度高，不看名字也能认出谁是谁
- **历年 bracket 存档** — 每个赛事可查历年签表（如 US Open 2015-2025）
- 头像优先使用官方高清照片，fallback 用姓名首字母+国旗
- 原生 app 体验优先

## Development Rules

### Code Rules（铁律）
1. **所有代码通过 Claude Code 编写**
2. **所有代码 commit 到 GitHub**
3. **GitHub Repo:** （待创建）
4. **Branch 策略:**
   - `main` — 稳定版本
   - `feat/<description>` — 功能分支
   - 完成后 PR → review → merge

## 开发计划（3 周 MVP）

### Week 1: 基础搭建
- [ ] 创建 GitHub repo
- [ ] 选定并接入数据 API
- [ ] 设计 PostgreSQL schema（球员、比赛、赛事）
- [ ] React Native (Expo) 项目搭建 + 导航路由
- [ ] 核心页面 wireframe（首页、球员、比赛、签表）
- [ ] 球员数据入库

### Week 2: 核心功能
- [ ] 球员档案页（头像、bio、排名历史、战绩）
- [ ] 比赛列表 + 实时比分
- [ ] 比赛详情页
- [ ] 搜索功能

### Week 3: 签表 + 打磨
- [ ] Tournament bracket UI（头像驱动）
- [ ] 历年签表存档
- [ ] 整体 UI 打磨
- [ ] 后端部署（Railway）
- [ ] TestFlight / APK 内测版发布

### Phase 2（MVP 后）
- H2H 对战分析
- 实时胜率模型（马尔可夫链/蒙特卡洛）
- 用户系统（收藏、关注球员）
- 推送通知
- App Store + Google Play 正式上线
