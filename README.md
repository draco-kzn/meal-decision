# 今天吃什么呢？

一个围绕目标日期来做每日饮食与生活决策的个人助理型 Web MVP。

线上地址：

- https://meal-decision-assistant.vercel.app

## 项目定位

这个项目不是简单的“随机吃什么”工具，而是一个围绕用户目标、地点、当天状态和餐厅知识库来生成建议的决策助手。

第一版重点解决三件事：

- 让用户先把目标、地点和餐厅库整理出来
- 基于规则引擎给出“今天吃什么”的明确建议
- 为后续接入 OpenClaw 作为 agent layer 预留完整接口

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS v4
- Prisma Client
- SQLite
- Vercel

## 当前能力

- Dashboard：首页展示当前目标、剩余天数、今日建议主卡和快捷入口
- 建档页：维护昵称、身高体重、饮食偏好、饮食禁忌、预算等级、叙事风格
- 目标页：维护目标标题、目标类型、目标日期、强度和备注
- 地点包页：维护常驻地点、场景标签、常出现时段、可接受步行距离
- 餐厅知识库页：按地点筛选餐厅，支持新增、编辑、删除
- 今日建议页：根据当天状态生成策略类型、推荐餐厅、推荐点法、备选方案、解释原因和一句叙事文案
- 反馈页：记录今天实际吃了什么、执行度和备注
- OpenClaw 适配层：预留长期记忆、地点补全、每日推送、反馈回写的接口

## OpenClaw 集成边界

应用侧负责：

- 用户建档
- 目标管理
- 地点包管理
- 餐厅知识库展示与维护
- 今日建议展示
- 调用 OpenClaw 接口

OpenClaw 负责：

- 长期记忆
- 外部网页信息补全
- 每日建议生成与主动推送
- 聊天式反馈入口
- 反馈沉淀

## 已实现的 OpenClaw 接口

代码位置：

- `lib/openclaw.ts`
- `app/api/openclaw/memory/route.ts`
- `app/api/openclaw/location/route.ts`
- `app/api/openclaw/push/route.ts`
- `app/api/openclaw/feedback/route.ts`

当前支持：

- `pullMemory(userId)`
- `enrichLocation(locationId)`
- `pushDailyRecommendation(userId, date)`
- `pushFeedback(userId, payload)`

默认情况下，这些接口会基于当前 SQLite 数据和规则引擎返回 mock OpenClaw 风格响应；如果后续配置了真实 OpenClaw 服务地址，则可以切换为远程调用。

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

## 目录结构

- `app/` 页面、布局与 API Route
- `components/` 页面组件
- `lib/` 数据访问、server actions、规则引擎、OpenClaw 适配层
- `prisma/` schema 和 seed
- `scripts/` SQLite 初始化脚本
- `types/` 共享类型

## 下一步

下一阶段更值得做的事情：

- 让今日建议页优先走 OpenClaw 接口，而不是只走本地规则引擎
- 增加聊天入口，把自然语言反馈映射到结构化上下文
- 把地点补全和餐厅补全真正接到 OpenClaw 的外部信息能力
- 做最近 7 日趋势和反馈闭环，让建议随使用逐渐收敛
