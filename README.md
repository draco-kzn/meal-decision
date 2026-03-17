# 今天吃什么呢？

一个围绕目标日期做每日饮食决策的个人助手型 Web MVP。

当前这版已经从“OpenClaw Ready”推进到“OpenClaw Connected”的应用侧集成状态：
- 页面端仍然负责建档、目标、地点包、餐厅库和建议展示
- OpenClaw 可以通过稳定 API 做餐厅补全、每日推荐导入、反馈回写和上下文同步
- 应用端保留本地规则引擎，OpenClaw 作为外部 agent layer 接入，而不是替代主数据库

## 当前能力

- Dashboard
- Profile setup
- Goals
- Location packs
- Restaurant library
- Daily recommendation
- Feedback

## Phase 2 对齐点

这次补齐的是应用侧与 OpenClaw 二期 brief 的契约，而不是重做前端。

已完成：
- 扩展 Prisma 数据模型
  - `Location.coverageStatus`
  - `Restaurant.enrichmentConfidence`
  - `DailyRecommendation.confidence`
  - `DailyFeedback.feedbackType`
  - `DailyFeedback.structuredPatchJson`
- `/api/restaurants/enrich` 兼容单餐厅和批量 enrichment payload
- `/api/recommendations/import` 兼容 OpenClaw recommendation import payload
- `/api/feedback/import` 支持结构化 chat feedback 导入，并在 `daily_context` 场景下同步更新 `DailyContext`
- `/api/daily-context` 支持 brief 里的轻量 daily context payload
- 增加 location coverage 评估逻辑，餐厅 enrichment 后会自动更新覆盖度
- Dashboard 和 Today 页面展示新的 recommendation 来源与置信度

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS v4
- Prisma Client
- SQLite
- Vercel

## 核心模型

- `User`
- `Goal`
- `Location`
- `Restaurant`
- `DailyContext`
- `DailyRecommendation`
- `DailyFeedback`

## OpenClaw 对接 API

读取：
- `GET /api/profile`
- `GET /api/goals/current`
- `GET /api/locations`
- `GET /api/restaurants?locationId=xxx`
- `GET /api/daily-context?date=YYYY-MM-DD`

写入：
- `POST /api/restaurants/enrich`
- `POST /api/recommendations/import`
- `POST /api/feedback/import`
- `POST /api/daily-context`

适配层：
- `POST /api/openclaw/memory`
- `POST /api/openclaw/location`
- `POST /api/openclaw/push`
- `POST /api/openclaw/feedback`

## 示例 payload

### `POST /api/restaurants/enrich`

```json
{
  "locationName": "公司",
  "name": "轻食厨房",
  "cuisine": "salad",
  "openHours": "11:00-20:30",
  "recommendedOrders": ["鸡胸双拼", "玉米", "温蔬菜"],
  "avoidOrders": ["甜饮", "重酱拌碗"],
  "notes": "稳定的工作日午餐选项",
  "source": ["https://example.com/menu"],
  "updatedAt": "2026-03-17",
  "enrichmentConfidence": "medium"
}
```

### `POST /api/recommendations/import`

```json
{
  "date": "2026-03-17",
  "mealType": "lunch",
  "strategyType": "balanced",
  "locationName": "公司",
  "restaurantName": "轻食厨房",
  "recommendedOrder": ["鸡胸双拼", "玉米", "温蔬菜", "酱料分开"],
  "fallbackOption": [
    {
      "restaurantName": "牛肉面馆",
      "recommendedOrder": ["清汤牛肉面", "不要额外小菜"]
    }
  ],
  "rationale": [
    "距离公司近",
    "容易控制",
    "符合今天的 balanced 策略"
  ],
  "narrativeLine": "午餐先稳住，晚上再给自己留一点空间。",
  "sourceType": "OPENCLAW",
  "confidence": "medium"
}
```

### `POST /api/feedback/import`

```json
{
  "date": "2026-03-17",
  "feedbackType": "daily_context",
  "rawText": "今天太累了，别给我太严格",
  "structuredPatch": {
    "energy": "low",
    "socialTonight": false
  }
}
```

### `POST /api/daily-context`

```json
{
  "date": "2026-03-17",
  "locationName": "公司",
  "energy": "low",
  "wantsSpicy": false,
  "socialTonight": true
}
```

## 本地运行

```powershell
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## 构建验证

```powershell
npm run build
```

## 说明

- `npm run db:push` 仍然走本地 SQLite bootstrap 脚本，不依赖 Prisma schema engine
- Vercel 通过 `postinstall` 自动执行 `prisma generate`
- 当前推荐仍可由本地规则引擎生成，也可以被 OpenClaw import 覆盖
