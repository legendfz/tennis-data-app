# TennisHQ — Design System

## 风格定位
FotMob 风格 + 年轻化。极简、干净、高信息密度、毛玻璃效果。

## 配色
| 用途 | 颜色 | 说明 |
|------|------|------|
| 背景 | #121212 | 纯深灰 |
| 卡片 | #1e1e1e | 微妙灰 |
| 边框 | #2a2a2a | 分隔线 |
| 文字主 | #ffffff | 标题、赢家 |
| 文字辅 | #888888 | 副标题、辅助信息 |
| 绿色（仅限） | #1a7a3a | Tab 选中、主按钮、进度条、排名▲ |
| 金色 | #c9a84c | 大满贯、奖金、决胜盘 |
| 红色 | #b71c1c | Live 标识、输的比赛、排名▼ |
| 蓝色 | #5a7ab5 | 可点击链接、品牌名 |

### 绿色使用限制
绿色只用在：Tab 选中状态、主按钮、进度条填充、日期 pill 选中、排名图表线。
赢家名字用白色加粗（不用绿色）。

## 字体
- **标题/比分/数字:** Space Grotesk, 700 weight
- **正文:** DM Sans, 400-600 weight
- 页面标题: 32px / 700
- Section 标题: 16px / 700, uppercase, letter-spacing 1px
- 正文: 14px / 400
- 辅助: 12px / 400
- 小标签: 10px / 600

## 圆角
- 卡片: 16-18px
- 头像: 12-28px（方圆角，不完全圆）
- 按钮/pills: 24px（全圆）
- 小标签: 8-10px
- 赛事 logo: 6-8px

## 交互
- 所有 TouchableOpacity: activeOpacity={0.7}
- 触摸目标最小 44x44px
- 对比度 ≥ 4.5:1

## 特效
- 毛玻璃: backdrop-filter blur(10-20px) + rgba 透明背景
- 渐变: 标题绿→青、进度条绿→青、头部紫蓝→深灰
- 背景: 网球场俯视图 4% 透明度
- 头部: 微弱网球光晕装饰

## 球员头像
- 真实照片（ATP 官网）→ DiceBear fallback → 字母 fallback
- 列表: 48-52px, 方圆角 16px
- 详情头部: 100-110px, 方圆角 28px
- 比赛对阵: 68-72px, 方圆角 20px
- Bracket: 32px

## 国旗
- flagcdn.com 图片 → emoji fallback
- 尺寸: 20x14 或 24x16, 圆角 2px
