import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    process.env[key] = rawValue.replace(/^"|"$/g, "");
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function getDateKey(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(date);
}

function splitList(value) {
  return String(value ?? "")
    .split(/[，,、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function daysUntil(targetDate, referenceDateKey) {
  if (!targetDate) {
    return 30;
  }

  const reference = new Date(`${referenceDateKey}T00:00:00+08:00`);
  const target = new Date(targetDate);
  return Math.max(Math.ceil((target.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24)), 0);
}

function chooseLocation({ locations, dailyContext, mealType }) {
  if (dailyContext?.currentLocationId) {
    return locations.find((location) => location.id === dailyContext.currentLocationId) ?? locations[0] ?? null;
  }

  const preferredSceneTag = mealType === "dinner" ? "晚餐" : "午餐";
  return (
    locations.find((location) => String(location.sceneTags ?? "").includes(preferredSceneTag)) ??
    locations.find((location) => location.coverageStatus === "rich") ??
    locations[0] ??
    null
  );
}

function inferStrategy({ goal, dailyContext, mealType, referenceDateKey }) {
  const daysLeft = daysUntil(goal?.targetDate, referenceDateKey);
  const mood = String(dailyContext?.mood ?? "").toLowerCase();
  const disciplineLevel = String(dailyContext?.disciplineLevel ?? "medium").toLowerCase();
  const socialPlan = String(dailyContext?.socialPlan ?? "").toLowerCase();
  const poorSleep = Number(dailyContext?.sleepHours ?? 7) < 6;

  if (daysLeft <= 14) {
    return "strict";
  }

  if (mealType === "lunch" && /social|party|date|聚餐|社交/.test(socialPlan)) {
    return "social_comp";
  }

  if (poorSleep && /tired|low|累|困|疲惫/.test(mood)) {
    return "recovery";
  }

  if (/low|低/.test(disciplineLevel)) {
    return "relaxed";
  }

  return "balanced";
}

function scoreRestaurant(restaurant, strategyType, locationName) {
  let score = restaurant.healthyScore * 0.55 + restaurant.satietyScore * 0.45;

  if (locationName?.includes("公司") && restaurant.walkMinutes <= 10) {
    score += 12;
  }

  if (strategyType === "strict") {
    score += restaurant.healthyScore * 0.25 - restaurant.avgPrice * 0.05;
  }

  if (strategyType === "relaxed") {
    score += restaurant.satietyScore * 0.25;
  }

  if (strategyType === "recovery" && /汤|粥|轻食|salad|soup|congee|healthy/i.test(restaurant.cuisine)) {
    score += 18;
  }

  return score;
}

function buildRationale({ strategyType, location, dailyContext }) {
  const lines = [];
  if (location?.name) {
    lines.push(`${location.name}附近优先短距离和执行成本低的选项`);
  }

  if (strategyType === "strict") {
    lines.push("距离目标日期更近，今天更适合稳一点");
  } else if (strategyType === "social_comp") {
    lines.push("晚上可能有社交安排，中午先留出弹性");
  } else if (strategyType === "recovery") {
    lines.push("今天状态偏疲惫，优先恢复感和稳定感");
  } else if (strategyType === "relaxed") {
    lines.push("今天不适合过严，但仍然需要边界");
  } else {
    lines.push("今天更适合稳定执行，而不是走极端");
  }

  if (dailyContext?.notes) {
    lines.push(`今日备注：${String(dailyContext.notes).split("\n")[0]}`);
  }

  return lines;
}

function buildNarrativeLine(strategyType, mealType) {
  if (strategyType === "strict") {
    return mealType === "lunch" ? "中午先守住，今天整天都会更轻松。" : "晚上收一收，是在替明天省力。";
  }

  if (strategyType === "social_comp") {
    return "这顿先稳住，后面的空间会更大。";
  }

  if (strategyType === "recovery") {
    return "今天先照顾状态，恢复比逞强更重要。";
  }

  if (strategyType === "relaxed") {
    return "可以松一点，但别把放松写成失控。";
  }

  return "今天不用极端，稳稳吃完就已经很好。";
}

function inferConfidence(restaurants, chosenRestaurant) {
  if (!chosenRestaurant) {
    return "low";
  }

  if (restaurants.length >= 4) {
    return "high";
  }

  if (restaurants.length >= 2) {
    return "medium";
  }

  return "low";
}

async function fetchJson(baseUrl, route) {
  const response = await fetch(`${baseUrl}${route}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`GET ${route} failed with ${response.status}`);
  }

  return response.json();
}

async function postJson(baseUrl, route, body) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`POST ${route} failed with ${response.status}: ${text}`);
  }

  return response.json();
}

async function main() {
  loadEnvFile(path.join(process.cwd(), ".env"));
  loadEnvFile(path.join(process.cwd(), ".env.local"));

  const args = parseArgs(process.argv.slice(2));
  const mealType = args.mealType ?? "lunch";
  const date = args.date ?? getDateKey();
  const shouldWrite = args.write === "true";
  const baseUrl = args.baseUrl ?? process.env.MEAL_APP_BASE_URL ?? "https://meal-decision-assistant.vercel.app";

  const [profile, goal, locations, dailyContext] = await Promise.all([
    fetchJson(baseUrl, "/api/profile"),
    fetchJson(baseUrl, "/api/goals/current"),
    fetchJson(baseUrl, "/api/locations"),
    fetchJson(baseUrl, `/api/daily-context?date=${encodeURIComponent(date)}`).catch(() => null)
  ]);

  const location = chooseLocation({
    locations,
    dailyContext,
    mealType
  });

  if (!location) {
    throw new Error("No location found for daily runner.");
  }

  const restaurants = await fetchJson(baseUrl, `/api/restaurants?locationId=${encodeURIComponent(location.id)}`);
  const strategyType = inferStrategy({ goal, dailyContext, mealType, referenceDateKey: date });
  const rankedRestaurants = [...restaurants].sort(
    (left, right) => scoreRestaurant(right, strategyType, location.name) - scoreRestaurant(left, strategyType, location.name)
  );

  const primary = rankedRestaurants[0] ?? null;
  const fallback = rankedRestaurants[1] ?? null;
  const result = {
    date,
    mealType,
    strategyType,
    locationId: location.id,
    locationName: location.name,
    restaurantId: primary?.id ?? null,
    restaurantName: primary?.name ?? "Protein Bento",
    recommendedOrder: splitList(primary?.recommendedOrders ?? "high protein bento, no sugary drink"),
    fallbackOption: fallback
      ? [
          {
            restaurantId: fallback.id,
            restaurantName: fallback.name,
            recommendedOrder: splitList(fallback.recommendedOrders)
          }
        ]
      : [],
    rationale: buildRationale({ strategyType, location, dailyContext }),
    narrativeLine: buildNarrativeLine(strategyType, mealType),
    sourceType: "OPENCLAW",
    confidence: inferConfidence(rankedRestaurants, primary)
  };

  if (shouldWrite) {
    const imported = await postJson(baseUrl, "/api/recommendations/import", {
      date: result.date,
      mealType: result.mealType,
      strategyType: result.strategyType,
      locationId: result.locationId,
      locationName: result.locationName,
      restaurantId: result.restaurantId,
      restaurantName: result.restaurantName,
      recommendedOrder: result.recommendedOrder,
      fallbackOption: result.fallbackOption,
      rationale: result.rationale,
      narrativeLine: result.narrativeLine,
      sourceType: result.sourceType,
      confidence: result.confidence,
      rawContextJson: {
        runner: "openclaw-daily-runner",
        profileId: profile?.id ?? null,
        goalId: goal?.id ?? null,
        currentLocationId: dailyContext?.currentLocationId ?? null
      }
    });

    console.log(
      JSON.stringify(
        {
          mode: "write",
          baseUrl,
          result,
          importedRecommendationId: imported.id,
          importedRestaurantId: imported.restaurantId
        },
        null,
        2
      )
    );
    return;
  }

  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        baseUrl,
        result
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
