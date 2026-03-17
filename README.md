# 今天吃什么呢？

围绕目标日期的每日饮食与生活决策助手 MVP。

技术栈：

- Next.js App Router
- React + TypeScript
- Tailwind CSS v4
- Prisma ORM
- SQLite

## 已实现内容

- Dashboard：首页展示当前目标、目标剩余天数、今日建议主卡、快速入口
- 建档页：维护昵称、身高、体重、饮食偏好、禁忌、预算等级、叙事风格
- 目标页：创建或编辑目标日期、目标类型、强度和备注
- 地点包页：维护常驻地点、场景标签、出现时段和步行半径
- 餐厅知识库页：按地点筛选餐厅，支持新增、编辑、删除
- 今日建议页：通过规则引擎生成策略类型、推荐餐厅、推荐点法、备选方案和叙事文案
- 反馈页：记录执行度、备注和图片 URL 占位字段
- OpenClaw 预留：`lib/openclaw.ts` 与 `app/api/openclaw/push/route.ts`

## 初始化

1. 安装依赖

```powershell
npm install
```

2. 配置环境变量

```powershell
Copy-Item .env.example .env
```

3. 初始化数据库并生成 Prisma Client

```powershell
npm run db:generate
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

## SQLite 初始化方式

项目使用 `DATABASE_URL="file:./dev.db"`。

首次运行时执行：

```powershell
npm run db:push
```

该命令会在 `prisma/dev.db` 初始化 SQLite 表结构，并供 Prisma Client 直接使用。

## 目录结构

- `app/` 页面、布局与 API Route
- `components/` 页面级组件
- `lib/` Prisma、server actions、推荐引擎、OpenClaw 占位
- `prisma/` schema 与 seed
- `types/` 共享类型

## 推荐逻辑

规则引擎位于 `lib/recommendation-engine.ts`，当前实现：

- 距离目标日期越近，越偏向节制策略
- 最近 7 日体重上升时，减少放松倾向
- 心情差且睡眠差时，优先恢复型方案
- 公司场景优先步行 10 分钟内餐厅
- 晚上有社交时，中午优先做社交补偿策略

后续可直接替换为 GPT-5.4 或 agent 调用层。

## OpenClaw 集成

OpenClaw 适合作为 agent layer，而不是主数据库。

当前已落地的接口适配层位于 `lib/openclaw.ts`，支持：

- `pullMemory(userId)`
- `enrichLocation(locationId)`
- `pushDailyRecommendation(userId, date)`
- `pushFeedback(userId, payload)`

当前已暴露的 API Route：

- `POST /api/openclaw/memory`
- `POST /api/openclaw/location`
- `POST /api/openclaw/push`
- `POST /api/openclaw/feedback`

说明：

- 默认情况下，这些接口会基于当前 SQLite 数据和规则引擎返回 mock OpenClaw 响应
- 如果设置了 `OPENCLAW_BASE_URL`，则会优先转发到真实 OpenClaw 服务
- 可选鉴权头使用 `OPENCLAW_API_KEY`
