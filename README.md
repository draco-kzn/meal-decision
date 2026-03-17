# 今天吃什么呢？

一个围绕目标日期做每日饮食决策的个人助理型 Web MVP。

当前项目已经从第一阶段的前端演示站，升级为第二阶段的 API 驱动产品骨架。

## 第二阶段已完成内容

- 扩展 Prisma 数据模型，补齐 `DailyContext` 和 `DailyRecommendation` 的关键字段
- 建立稳定 API 边界，而不是让页面直接拼 seed 和本地逻辑
- 拆分 recommendation 模块：
  - `lib/recommendation/context-builder.ts`
  - `lib/recommendation/rule-engine.ts`
  - `lib/recommendation/narrative-builder.ts`
  - `lib/recommendation/provider-adapters/*`
- 将 Dashboard 和 今日建议页改成 API 驱动
- 补齐 OpenClaw 导入/回写接口

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS v4
- Prisma Client
- SQLite
- Vercel

## 数据模型

当前核心模型：

- `User`
- `Goal`
- `Location`
- `Restaurant`
- `DailyContext`
- `DailyRecommendation`
- `DailyFeedback`

其中第二阶段新增/强化：

### DailyContext

承接某一天的动态上下文：

- `date`
- `currentLocationId`
- `mood`
- `disciplineLevel`
- `socialPlan`
- `weightToday`
- `stepsToday`
- `sleepHours`
- `weatherSummary`
- `weatherTempC`
- `lunarTag`
- `solarTermTag`
- `astroTag`
- `notes`

### DailyRecommendation

保存某天某餐次的 recommendation 结果：

- `strategyType`
- `restaurantId`
- `recommendedOrder`
- `fallbackOption`
- `rationale`
- `narrativeLine`
- `sourceType`
- `rawContextJson`

## 已实现 API

### 读取类 API

- `GET /api/profile`
- `GET /api/goals/current`
- `GET /api/locations`
- `GET /api/restaurants?locationId=xxx`
- `GET /api/daily-context?date=YYYY-MM-DD`
- `GET /api/recommendations?date=YYYY-MM-DD&mealType=lunch`
- `GET /api/dashboard?date=YYYY-MM-DD`
- `GET /api/feedback?limit=5`

### 写入类 API

- `POST /api/profile`
- `POST /api/goals`
- `POST /api/locations`
- `POST /api/restaurants`
- `POST /api/daily-context`
- `POST /api/recommendations`
- `POST /api/feedback`

### recommendation / OpenClaw 相关 API

- `POST /api/recommendations/generate`
- `POST /api/recommendations/import`
- `POST /api/restaurants/enrich`
- `POST /api/feedback/import`

### OpenClaw 适配层 API

- `POST /api/openclaw/memory`
- `POST /api/openclaw/location`
- `POST /api/openclaw/push`
- `POST /api/openclaw/feedback`

## recommendation 模块结构

### `lib/recommendation/context-builder.ts`

负责聚合：

- user
- current goal
- selected location
- restaurants
- daily context
- weather/lunar/astro provider signal
- recent weight trend
- recent adherence trend

### `lib/recommendation/rule-engine.ts`

负责输出：

- `STRICT`
- `BALANCED`
- `RELAXED`
- `SOCIAL_COMP`
- `RECOVERY`

并给出候选餐厅列表。

### `lib/recommendation/narrative-builder.ts`

负责基于叙事风格生成展示文案。

### `lib/recommendation/provider-adapters/`

当前包含：

- `weather.ts`
- `lunar.ts`
- `astrology.ts`
- `openclaw.ts`

默认先走占位/本地适配，后续可以替换成真实外部服务。

## 当前页面状态

### Dashboard

已改成 API 驱动：

- 读取 `/api/dashboard`
- 不再直接依赖 seed 数据
- 实时展示当前目标、剩余天数、今日 recommendation、地点数、餐厅数、最近反馈、叙事风格

### 今日建议页

已改成 API 驱动：

- 可选择 `date`
- 可选择 `mealType`
- 可选择 location
- 先保存 `DailyContext`
- 再调用 `POST /api/recommendations/generate`

## OpenClaw 边界

网页端负责：

- profile / goals / locations / restaurants 的录入与管理
- DailyContext 的录入
- recommendation 的展示
- 调用 OpenClaw 接口

OpenClaw 负责：

- 长期记忆
- 餐厅/地点信息补全
- recommendation 导入
- 聊天反馈结构化
- 反馈沉淀

## 本地运行

1. 安装依赖

```powershell
npm install
```

2. 生成 Prisma Client

```powershell
npm run db:generate
```

3. 初始化 SQLite

```powershell
npm run db:push
```

4. 写入示例数据

```powershell
npm run db:seed
```

5. 启动开发环境

```powershell
npm run dev
```

## 构建验证

```powershell
npm run build
```

## 第二阶段完成标准

当前这版已经满足：

- 录入 profile / goals / locations / restaurants
- 创建某天的 `DailyContext`
- 通过 API 触发 recommendation generation
- 后端基于真实数据库数据生成 recommendation
- recommendation 可以被未来的 OpenClaw 定时任务导入或覆盖

这一步完成后，项目已经从“原型展示站”进入“可联调产品阶段”。
