$root = "C:\Users\zeyuh\.openclaw\workspace\diet-life-agent"

$files = [ordered]@{}

$files["MEMORY.md"] = @'
# MEMORY.md

## Current Goal Summary
- currentGoalSummary: Keep weekday lunches stable and supportive for gradual fat loss before May Day.
- coreTargetDate: 2026-05-01
- dietaryRestrictions: [lactose_intolerance, avoid_iced_drinks]
- dietaryPreferences: [high_protein, weekday_lunch_light, weekend_flexible]
- budgetPreference: mid
- narrativeStyle: gentle-practical
- commonFailureModes: [overtired_takeout, low_sleep_snacking, social_dinner_overcompensation]
- encouragementStyle: calm, practical, short, non-judgmental

## Stable Rules
- OpenClaw is not the system of record.
- Prefer app APIs first; use memory-only fallback only when APIs are unavailable.
- If restaurant information is uncertain, write unknown instead of guessing.
- Recommendations must be explainable and directly executable.
'@

$files["README.md"] = @'
# Diet Life Agent

This workspace is the OpenClaw-side Phase 2 implementation for the meal decision project.

OpenClaw is responsible for:
- maintaining long-term memory
- enriching known restaurants with public-web information
- assessing whether a location pack is usable
- generating lunch and dinner recommendations on schedule
- parsing lightweight chat feedback
- writing enrichment, recommendation, and feedback results back to app APIs

OpenClaw is not responsible for:
- replacing the app database
- replacing frontend CRUD
- broad city-wide restaurant discovery in phase 2

## Workspace Structure
- `MEMORY.md`: stable long-term preferences and rules
- `memory/goals/current-goal.md`: current active goal card
- `memory/locations/*.md`: location cards
- `memory/restaurants/*.md`: restaurant cards
- `skills/`: workflow instructions for the agent
- `prompts/`: system prompts for enrichment, recommendation, and feedback parsing
- `automation/`: recommended cron task definitions
- `integration/`: app API contract and payload examples
- `schemas/`: stable JSON schemas

## Phase 2 Connected Definition
The system is considered connected when:
- at least one location pack is usable
- at least three restaurant cards are enriched
- lunch cron can write back recommendation JSON
- dinner cron can write back recommendation JSON
- chat feedback can update daily context or feedback import

## Operating Mode
- API-first: use app APIs as the main read/write path
- Memory fallback: if APIs fail, continue with local memory files and sync later
'@

$files["PHASE2_PLAN.md"] = @'
# PHASE2_PLAN.md

## Objective
Connect OpenClaw as the external memory, enrichment, automation, and feedback layer for the meal decision app.

## Scope
1. Build stable memory files for goal, locations, and restaurants.
2. Define known-restaurant enrichment workflow.
3. Define location coverage assessment workflow.
4. Define lunch and dinner recommendation cron workflows.
5. Define structured chat feedback parsing and write-back.
6. Keep everything API-first with memory fallback.

## Exit Criteria
- one usable location pack
- three enriched restaurant cards
- lunch recommendation cron spec complete
- dinner recommendation cron spec complete
- chat feedback workflow spec complete
- API contract matches app-side Phase 2 routes
'@

$files["MINIMUM_PHASE2_RUNBOOK.md"] = @'
# MINIMUM_PHASE2_RUNBOOK.md

## Goal
Run the smallest useful OpenClaw-connected loop without replacing the app backend.

## Execution Order
1. User records a location in the app.
2. User records 2-5 real restaurants they actually use.
3. OpenClaw runs `enrich_restaurant_details` for known restaurants.
4. OpenClaw runs `assess_location_coverage`.
5. `daily_lunch_recommendation` runs at 11:00 Asia/Shanghai.
6. `daily_dinner_recommendation` runs at 17:30 Asia/Shanghai.
7. User messages are processed by `process_chat_feedback`.

## API-first Mode
- Read from app APIs first.
- Write results back immediately through app APIs.
- Update local memory files after successful API writes when appropriate.

## Memory-only Fallback Mode
- Read `MEMORY.md`, current goal, location cards, and restaurant cards.
- Produce recommendation or feedback parse result locally.
- Record pending write-back when app APIs are temporarily unavailable.

## MVP-2 Success Condition
- at least one location pack is usable
- at least three restaurant cards are enriched
- lunch cron can write recommendation back
- dinner cron can write recommendation back
- chat feedback can update daily context or feedback import
'@

$files["integration\api-contract.md"] = @'
# API Contract

## Read APIs
- `GET /api/profile`
- `GET /api/goals/current`
- `GET /api/locations`
- `GET /api/restaurants?locationId=...`
- `GET /api/daily-context?date=YYYY-MM-DD`

## Write APIs
- `POST /api/restaurants/enrich`
- `POST /api/recommendations/import`
- `POST /api/feedback/import`
- `POST /api/daily-context`

## Design Rules
- Prefer API-first mode whenever the app backend is reachable.
- Fall back to memory-only mode when APIs are not available.
- Do not invent missing restaurant facts; write `unknown`.
- Keep recommendation JSON stable so the website can render it directly.

## Notes for OpenClaw
- `POST /api/restaurants/enrich` supports either a single restaurant payload or a batch payload with `restaurants: []`.
- `POST /api/recommendations/import` accepts `locationName`, `restaurantName`, `fallbackOption`, `sourceType`, and `confidence`.
- `POST /api/feedback/import` supports `daily_context`, `direct_feedback`, `stable_preference`, `goal_update`, and `consumption_log` style payloads.
- `POST /api/daily-context` can accept lightweight fields such as `locationName`, `energy`, `wantsSpicy`, and `socialTonight`.
'@

$files["integration\api-examples.md"] = @'
# API Examples

## GET /api/profile
```http
GET /api/profile
```

## GET /api/goals/current
```http
GET /api/goals/current
```

## GET /api/locations
```http
GET /api/locations
```

## GET /api/restaurants?locationId=<locationId>
```http
GET /api/restaurants?locationId=<locationId>
```

## GET /api/daily-context?date=2026-03-18
```http
GET /api/daily-context?date=2026-03-18
```

## POST /api/restaurants/enrich
```json
{
  "locationName": "公司",
  "name": "谷仓能量碗",
  "cuisine": "轻食",
  "openHours": "10:30-20:00",
  "recommendedOrders": ["鸡腿肉藜麦能量碗", "酱料减半"],
  "avoidOrders": ["双倍薯片", "高糖饮料"],
  "notes": "stable weekday lunch option",
  "source": ["manual-seed"],
  "updatedAt": "2026-03-18",
  "enrichmentConfidence": "medium"
}
```

## POST /api/recommendations/import
```json
{
  "date": "2026-03-18",
  "mealType": "lunch",
  "strategyType": "balanced",
  "locationName": "公司",
  "restaurantName": "谷仓能量碗",
  "recommendedOrder": ["鸡腿肉藜麦能量碗", "酱料减半", "补一份热汤"],
  "fallbackOption": [
    {
      "restaurantName": "一碗乌冬",
      "recommendedOrder": ["番茄肥牛乌冬", "少喝汤", "不加炸物"]
    }
  ],
  "rationale": [
    "office lunch should prioritize short walking distance",
    "today is a balanced day",
    "this option is stable and easy to control"
  ],
  "narrativeLine": "Stay steady at lunch and leave room for the evening.",
  "sourceType": "OPENCLAW",
  "confidence": "medium"
}
```

## POST /api/feedback/import
```json
{
  "date": "2026-03-18",
  "feedbackType": "daily_context",
  "rawText": "今天太累了，别给我太严格",
  "structuredPatch": {
    "energy": "low",
    "socialTonight": false
  }
}
```

## POST /api/daily-context
```json
{
  "date": "2026-03-18",
  "locationName": "公司",
  "energy": "low",
  "wantsSpicy": false,
  "socialTonight": true
}
```
'@

$files["prompts\system_restaurant_enrichment.md"] = @'
# system_restaurant_enrichment.md

You are the restaurant enrichment agent for the meal decision system.

## Goal
Enrich a known restaurant card using public web information and location context.

## Input
You will receive:
1. location context
2. minimum known restaurant fields
3. public web search/fetch results

## Allowed Fields To Fill
- cuisine
- openHours
- recommendedOrders
- avoidOrders
- notes
- source
- updatedAt
- enrichmentConfidence

## Hard Rules
- Use only public web sources.
- If a field is uncertain, write `unknown`.
- Do not invent opening hours, dishes, or address details.
- Phase 2 is for known-restaurant enrichment, not broad nearby discovery.

## Output JSON Schema
```json
{
  "name": "string",
  "locationName": "string",
  "cuisine": "string|unknown",
  "openHours": "string|unknown",
  "recommendedOrders": ["string"],
  "avoidOrders": ["string"],
  "notes": "string|unknown",
  "source": ["https://..."],
  "updatedAt": "YYYY-MM-DD",
  "enrichmentConfidence": "high|medium|low"
}
```
'@

$files["prompts\system_daily_recommendation.md"] = @'
# system_daily_recommendation.md

You are the daily recommendation generator for the meal decision system.

## Goal
Produce one executable meal recommendation using current goal pressure, today context, location, and known restaurant cards.

## Input
You will receive:
1. current goal summary
2. remaining days to target date
3. current meal type
4. current location context
5. candidate restaurant list
6. today context
7. recent adherence / stability hints

## Hard Rules
- Do not invent restaurants.
- Do not invent missing restaurant fields.
- Prefer short walking distance for office lunch.
- If confidence is low, say so explicitly in JSON.
- Recommendation must stay inside the schema below.

## Output JSON Schema
```json
{
  "date": "2026-03-18",
  "mealType": "lunch|dinner",
  "strategyType": "strict|balanced|relaxed|social_comp|recovery",
  "locationName": "string",
  "restaurantName": "string",
  "recommendedOrder": ["string"],
  "fallbackOption": [
    {
      "restaurantName": "string",
      "recommendedOrder": ["string"]
    }
  ],
  "rationale": ["string"],
  "narrativeLine": "string",
  "sourceType": "OPENCLAW",
  "confidence": "high|medium|low"
}
```
'@

$files["prompts\feedback_parser.md"] = @'
# feedback_parser.md

You are the chat feedback parser for the meal decision system.

## Task
Classify a user message into one structured feedback result.

## Feedback Type Enum
- stable_preference
- daily_context
- direct_feedback
- goal_update
- consumption_log

## Input
- raw user message
- current date
- optional current goal summary

## Rules
- Temporary status or mood should prefer `daily_context`.
- Long-term repeated preference changes should use `stable_preference`.
- Already consumed food should prefer `consumption_log`.
- Goal deadline or intensity changes should use `goal_update`.
- Do not invent facts the user did not say.

## Output JSON Schema
```json
{
  "feedbackType": "stable_preference|daily_context|direct_feedback|goal_update|consumption_log",
  "rawText": "string",
  "structuredPatch": {},
  "shouldUpdateMemory": true,
  "shouldUpdateDailyContext": true,
  "shouldRegenerateRecommendation": false,
  "reason": "string"
}
```
'@

$files["skills\enrich_restaurant_details.md"] = @'
# enrich_restaurant_details

## Goal
Enrich known restaurants, not broad city-wide discovery.

## Input
- restaurantName
- locationName
- addressText (optional)
- existingFields (optional)

## Workflow
1. Read the matching location card.
2. Use public web search to find 1-3 trustworthy pages.
3. Fetch public pages and extract cuisine, openHours, signature dishes, address hints, and review summary.
4. Build structured output.
5. Write the restaurant card to `memory/restaurants/*.md`.
6. POST the result to `/api/restaurants/enrich`.
7. If write-back fails, keep the local card and mark the API write as pending.

## Output JSON
```json
{
  "name": "string",
  "locationName": "string",
  "cuisine": "string|unknown",
  "openHours": "string|unknown",
  "recommendedOrders": ["string"],
  "avoidOrders": ["string"],
  "notes": "string|unknown",
  "source": ["https://..."],
  "updatedAt": "YYYY-MM-DD",
  "enrichmentConfidence": "high|medium|low"
}
```

## Rules
- Only use public web sources.
- If uncertain, write `unknown`.
- Do not invent operating hours or dishes.
- Phase 2 prioritizes enriching known restaurants already used by the user.
'@

$files["skills\assess_location_coverage.md"] = @'
# assess_location_coverage

## Goal
Assess whether one location pack is usable enough for recommendation generation.

## Input
- one location card
- all restaurant cards under that location

## Output
- coverageStatus: `empty | partial | rich`
- suggestedNextStep

## Suggested Logic
- 0 restaurants -> `empty`
- 1-3 restaurants -> `partial`
- >=4 restaurants and enough variety for at least 2 strategy types -> `rich`

## Example Output
```json
{
  "locationName": "office",
  "coverageStatus": "partial",
  "suggestedNextStep": "continue enriching known restaurants or ask user to add 2 more real options"
}
```
'@

$files["skills\daily_lunch_recommendation.md"] = @'
# daily_lunch_recommendation

## Recommended Time
Every day at 11:00 Asia/Shanghai.

## Inputs
Prefer app APIs first:
- GET /api/profile
- GET /api/goals/current
- GET /api/locations
- GET /api/restaurants?locationId=...
- GET /api/daily-context?date=YYYY-MM-DD

Fallback memory sources:
- MEMORY.md
- memory/goals/current-goal.md
- memory/locations/*.md
- memory/restaurants/*.md

## Workflow
1. Read current goal and remaining days.
2. Read daily context if available.
3. Infer current meal location, or use default location.
4. Select candidate restaurants.
5. Generate recommendation JSON.
6. POST to `/api/recommendations/import`.
7. Optionally send to a chat channel.

## Required Output Fields
- date
- mealType=lunch
- strategyType
- locationName
- restaurantName
- recommendedOrder
- fallbackOption
- rationale
- narrativeLine
- sourceType=OPENCLAW
- confidence
'@

$files["skills\daily_dinner_recommendation.md"] = @'
# daily_dinner_recommendation

## Recommended Time
Every day at 17:30 Asia/Shanghai.

## Inputs
Prefer app APIs first:
- GET /api/profile
- GET /api/goals/current
- GET /api/locations
- GET /api/restaurants?locationId=...
- GET /api/daily-context?date=YYYY-MM-DD

Fallback memory sources:
- MEMORY.md
- memory/goals/current-goal.md
- memory/locations/*.md
- memory/restaurants/*.md

## Workflow
1. Read current goal and remaining days.
2. Read daily context if available.
3. Infer current meal location, or use default location.
4. Select candidate restaurants.
5. Generate recommendation JSON.
6. POST to `/api/recommendations/import`.
7. Optionally send to a chat channel.

## Required Output Fields
- date
- mealType=dinner
- strategyType
- locationName
- restaurantName
- recommendedOrder
- fallbackOption
- rationale
- narrativeLine
- sourceType=OPENCLAW
- confidence
'@

$files["skills\process_chat_feedback.md"] = @'
# process_chat_feedback

## Typical Inputs
- I will be near the office at lunch today.
- I'm too tired today.
- I already had malatang.
- I messed up today.
- I want something spicy.
- I have a photo shoot next week, so I want to tighten up this week.

## Feedback Type Enum
- stable_preference
- daily_context
- direct_feedback
- goal_update
- consumption_log

## Workflow
1. Parse the feedback type.
2. Generate structured output using the standard schema.
3. POST to `/api/feedback/import` or `/api/daily-context`.
4. Update memory if and only if the message reflects a stable preference.
5. Trigger recommendation refresh if needed.

## Output JSON Schema
```json
{
  "feedbackType": "stable_preference|daily_context|direct_feedback|goal_update|consumption_log",
  "rawText": "string",
  "structuredPatch": {},
  "shouldUpdateMemory": true,
  "shouldUpdateDailyContext": true,
  "shouldRegenerateRecommendation": false,
  "reason": "string"
}
```
'@

$files["schemas\recommendation.schema.json"] = @'
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "OpenClaw Daily Recommendation",
  "type": "object",
  "required": [
    "date",
    "mealType",
    "strategyType",
    "locationName",
    "restaurantName",
    "recommendedOrder",
    "fallbackOption",
    "rationale",
    "narrativeLine",
    "sourceType",
    "confidence"
  ],
  "properties": {
    "date": { "type": "string" },
    "mealType": { "type": "string", "enum": ["lunch", "dinner"] },
    "strategyType": {
      "type": "string",
      "enum": ["strict", "balanced", "relaxed", "social_comp", "recovery"]
    },
    "locationName": { "type": "string" },
    "restaurantName": { "type": "string" },
    "recommendedOrder": {
      "type": "array",
      "items": { "type": "string" }
    },
    "fallbackOption": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["restaurantName", "recommendedOrder"],
        "properties": {
          "restaurantName": { "type": "string" },
          "recommendedOrder": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "additionalProperties": true
      }
    },
    "rationale": {
      "type": "array",
      "items": { "type": "string" }
    },
    "narrativeLine": { "type": "string" },
    "sourceType": { "type": "string", "enum": ["OPENCLAW"] },
    "confidence": { "type": "string", "enum": ["high", "medium", "low"] }
  },
  "additionalProperties": true
}
'@

$files["automation\daily_lunch_recommendation.cron"] = @'
name: daily-lunch-recommendation
schedule: "0 11 * * *"
timezone: "Asia/Shanghai"
task: |
  Run task daily_lunch_recommendation.
  Read API first:
  - GET /api/profile
  - GET /api/goals/current
  - GET /api/locations
  - GET /api/restaurants?locationId=...
  - GET /api/daily-context?date=YYYY-MM-DD

  Fallback to memory files when API is unavailable.

  Output JSON fields:
  - date
  - mealType=lunch
  - strategyType
  - locationName
  - restaurantName
  - recommendedOrder
  - fallbackOption
  - rationale
  - narrativeLine
  - sourceType=OPENCLAW
  - confidence

  Write back:
  - POST /api/recommendations/import
'@

$files["automation\daily_dinner_recommendation.cron"] = @'
name: daily-dinner-recommendation
schedule: "30 17 * * *"
timezone: "Asia/Shanghai"
task: |
  Run task daily_dinner_recommendation.
  Read API first:
  - GET /api/profile
  - GET /api/goals/current
  - GET /api/locations
  - GET /api/restaurants?locationId=...
  - GET /api/daily-context?date=YYYY-MM-DD

  Fallback to memory files when API is unavailable.

  Output JSON fields:
  - date
  - mealType=dinner
  - strategyType
  - locationName
  - restaurantName
  - recommendedOrder
  - fallbackOption
  - rationale
  - narrativeLine
  - sourceType=OPENCLAW
  - confidence

  Write back:
  - POST /api/recommendations/import
'@

$files["memory\goals\current-goal.md"] = @'
# current-goal.md

- title: 五一前减脂并稳定午餐节奏
- goalType: fat_loss
- targetDate: 2026-05-01
- intensity: medium
- notes: weekday lunch should stay stable; dinner can be flexible but not out of control.
'@

$files["memory\locations\office-main.md"] = @'
# Location Card

- name: 公司
- addressText: 静安区写字楼商圈
- sceneTags: [workday_lunch, workday_dinner, overtime]
- appearanceWindows: [11:30-14:00, 18:30-21:00]
- walkRadiusM: 800
- notes: rainy day = do not walk far; lunch should prefer queues that move quickly.
- restaurantCoverageStatus: rich
'@

$files["memory\locations\home-base.md"] = @'
# Location Card

- name: 家
- addressText: 徐汇区社区生活圈
- sceneTags: [dinner, weekend, recovery]
- appearanceWindows: [19:00-23:00, 10:00-21:00]
- walkRadiusM: 1200
- notes: dinner should favor comfort and recovery; this location can accept a slightly longer walk.
- restaurantCoverageStatus: partial
'@

$files["memory\restaurants\gu-cang-energy-bowl.md"] = @'
# Restaurant Card

- name: 谷仓能量碗
- locationName: 公司
- cuisine: 轻食
- avgPrice: 32
- openHours: 10:30-20:00
- walkMinutes: 7
- recommendedOrders: [鸡腿肉藜麦能量碗, 酱料减半, 热汤]
- avoidOrders: [双倍薯片, 高糖饮料]
- notes: stable weekday lunch option; good when work is dense and walking should stay short.
- source: [manual-seed]
- updatedAt: 2026-03-18
- enrichmentConfidence: medium
'@

$files["memory\restaurants\yi-wan-udon.md"] = @'
# Restaurant Card

- name: 一碗乌冬
- locationName: 公司
- cuisine: 日式面食
- avgPrice: 28
- openHours: 11:00-21:30
- walkMinutes: 5
- recommendedOrders: [番茄肥牛乌冬, 少喝汤]
- avoidOrders: [炸鸡乌冬双拼]
- notes: emotionally comforting but still controllable; useful as a balanced fallback.
- source: [manual-seed]
- updatedAt: 2026-03-18
- enrichmentConfidence: medium
'@

$files["memory\restaurants\qing-mu-salad.md"] = @'
# Restaurant Card

- name: 青木沙拉
- locationName: 公司
- cuisine: 沙拉 / healthy bowl
- avgPrice: 42
- openHours: 10:00-20:30
- walkMinutes: 8
- recommendedOrders: [鸡胸双拼沙拉, 玉米, 温蔬菜, 酱料分开]
- avoidOrders: [甜饮, 重酱拌碗]
- notes: a stronger strict-day option when lunch needs to stay light but stable.
- source: [manual-seed]
- updatedAt: 2026-03-18
- enrichmentConfidence: medium
'@

$files["memory\restaurants\nuan-xin-soup.md"] = @'
# Restaurant Card

- name: 暖心汤面
- locationName: 公司
- cuisine: 汤面 / soup noodles
- avgPrice: 30
- openHours: 10:30-21:00
- walkMinutes: 6
- recommendedOrders: [清汤牛肉面, 不加炸物, 少喝汤]
- avoidOrders: [炸鸡套餐, 高糖奶茶]
- notes: useful as a recovery or rainy-day fallback near the office.
- source: [manual-seed]
- updatedAt: 2026-03-18
- enrichmentConfidence: low
'@

$files["memory\restaurants\shan-ye-congee.md"] = @'
# Restaurant Card

- name: 山野粥铺
- locationName: 家
- cuisine: 粥品
- avgPrice: 22
- openHours: 06:00-23:30
- walkMinutes: 9
- recommendedOrders: [皮蛋瘦肉粥, 清炒时蔬]
- avoidOrders: [油条双拼]
- notes: reliable recovery-day or late-night dinner option.
- source: [manual-seed]
- updatedAt: 2026-03-18
- enrichmentConfidence: medium
'@

$files["memory\restaurants\lu-bian-fried.md"] = @'
# Restaurant Card

- name: 炉边烤物
- locationName: 家
- cuisine: 韩式炸鸡
- avgPrice: 58
- openHours: 11:30-01:00
- walkMinutes: 12
- recommendedOrders: [半份原味炸鸡, 气泡水]
- avoidOrders: [双拼炸鸡, 芝士年糕]
- notes: only suitable for relaxed days; high risk for overshooting.
- source: [manual-seed]
- updatedAt: 2026-03-18
- enrichmentConfidence: low
'@

foreach ($relativePath in $files.Keys) {
  $fullPath = Join-Path $root $relativePath
  $directory = Split-Path $fullPath -Parent
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
  }

  Set-Content -Path $fullPath -Value $files[$relativePath] -Encoding UTF8
}

$toRemove = @(
  "automation\daily_recommendation.cron",
  "skills\enrich_restaurant.md",
  "skills\generate_daily_recommendation.md",
  "skills\process_feedback.md",
  "skills\process_chat_feedback_v2.md"
)

foreach ($relativePath in $toRemove) {
  $fullPath = Join-Path $root $relativePath
  if (Test-Path $fullPath) {
    Remove-Item -Force $fullPath
  }
}

Write-Host "OpenClaw Phase 2 workspace updated at $root"
