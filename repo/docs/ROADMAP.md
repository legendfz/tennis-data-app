# TennisHQ — Roadmap

## Phase 1: MVP ✅ (完成)
- 项目搭建（React Native Expo + Express + Prisma）
- ATP Top 50 球员 + 105 场比赛 + 14 个赛事
- 核心页面：首页/球员/比赛/赛事/H2H
- 胜率模型（5 因子）
- 基础 UI（FotMob 风格）

## Phase 2: 打磨 (进行中)
- [x] UI 年轻化（毛玻璃/渐变/粗字体）
- [x] 逐局时间线 + 详细统计
- [x] NCAA 风格 Bracket
- [x] 真实球员头像 + 国旗 + 赛事 logo
- [x] 全页面互联导航
- [x] Comments 投票系统
- [x] 品牌排行榜
- [ ] 按 v2 效果图重构代码
- [ ] 最终 UI 审查

## Phase 3: 扩展
- WTA Top 200 球员
- ATP 扩展到 Top 200
- ATP/WTA filter（首页 + 球员列表）
- 更多赛事数据
- 双打数据

## Phase 4: 真实数据
- 接 RapidAPI Tennis API（免费 500 请求/月起步）
- 数据同步管线（定时拉取 → PostgreSQL）
- 本地缓存策略
- 实时比分 WebSocket

## Phase 5: 部署上线
- 后端部署（Railway/Fly.io）
- Expo EAS Build（iOS + Android）
- TestFlight 内测
- App Store + Google Play 上架

## Phase 6: 商业化
- 用户注册/登录（Google/Apple Sign In）
- 免费层 + 付费订阅
  - 免费：基础比分、球员档案、签表
  - 付费：实时胜率分析、深度 H2H、历史数据、无广告
- 推送通知（比赛开始/关注球员）
- 社交分享

## Phase 7: 高级功能
- ML 胜率模型（训练数据 → 更准确）
- 实时比分逐分更新
- 视频集锦集成
- 赛事日历/提醒
- 球员对比工具
- 数据导出（CSV/PDF）

## 数据 API 路线
1. **$0/月** — RapidAPI 免费 + JeffSackmann 开源数据
2. **$10-50/月** — API-Tennis 付费层
3. **$200+/月** — Sportradar 全覆盖

## 技术架构演进
```
现在: JSON 文件 → Express API → React Native
  ↓
上线: PostgreSQL → Express API → React Native
  ↓
规模: PostgreSQL + Redis 缓存 → Express + WebSocket → React Native + 推送
```
