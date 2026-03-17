import type { Restaurant } from "@prisma/client";

import type { RecommendationContext, RuleEngineOutput } from "@/lib/recommendation/types";

function daysUntil(targetDate: Date | null) {
  if (!targetDate) {
    return 30;
  }

  const diff = targetDate.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function matchesPattern(value: string, pattern: RegExp) {
  return pattern.test(value.toLowerCase());
}

function scoreRestaurant(restaurant: Restaurant, output: RuleEngineOutput, locationName: string | null) {
  let score = restaurant.healthyScore * 0.55 + restaurant.satietyScore * 0.45;

  if (locationName?.includes("公司") && restaurant.walkMinutes <= 10) {
    score += 12;
  }

  if (output.strategyType === "STRICT") {
    score += restaurant.healthyScore * 0.3 - restaurant.avgPrice * 0.1;
  }

  if (output.strategyType === "BALANCED") {
    score += restaurant.healthyScore * 0.18 + restaurant.satietyScore * 0.12;
  }

  if (output.strategyType === "RELAXED") {
    score += restaurant.satietyScore * 0.3;
  }

  if (output.strategyType === "SOCIAL_COMP") {
    score += restaurant.healthyScore * 0.22;
  }

  if (
    output.strategyType === "RECOVERY" &&
    /soup|congee|light|salad|粥|汤|轻食|沙拉/i.test(restaurant.cuisine)
  ) {
    score += 18;
  }

  return score;
}

export function runRuleEngine(context: RecommendationContext): RuleEngineOutput {
  const daysLeft = daysUntil(context.goal?.targetDate ?? null);
  const mood = context.dailyContext.mood ?? "";
  const socialPlan = context.dailyContext.socialPlan ?? "";
  const disciplineLevel = context.dailyContext.disciplineLevel ?? "medium";
  const moodLow = matchesPattern(mood, /(low|tired|stress|sad|累|困|疲惫|低落)/i);
  const disciplineHigh = matchesPattern(disciplineLevel, /(high|高)/i);
  const disciplineLow = matchesPattern(disciplineLevel, /(low|低)/i);
  const socialTonight = matchesPattern(socialPlan, /(social|dinner|party|date|聚餐|社交|约会)/i);
  const weightUp = context.recentWeightTrendKg > 0.4;
  const poorSleep = (context.dailyContext.sleepHours ?? 7) < 6;

  const reasons: string[] = [];
  let strategyType: RuleEngineOutput["strategyType"] = "BALANCED";

  if (daysLeft <= 14) {
    strategyType = "STRICT";
    reasons.push("距离目标日期已经比较近，今天更适合稳一点。");
  }

  if (weightUp && disciplineHigh) {
    strategyType = "STRICT";
    reasons.push("最近体重有回弹，自律意愿又不低，今天可以收一收。");
  }

  if (socialTonight && context.mealType === "lunch") {
    strategyType = "SOCIAL_COMP";
    reasons.push("今晚有社交安排，中午更适合提前留出弹性。");
  }

  if (poorSleep && moodLow) {
    strategyType = "RECOVERY";
    reasons.push("睡眠和精神状态都一般，今天优先恢复感而不是极端克制。");
  }

  if (moodLow && disciplineLow && strategyType === "BALANCED") {
    strategyType = "RELAXED";
    reasons.push("今天状态不算强，允许一点满足感，但仍然要可控。");
  }

  if (context.recentLowAdherenceCount >= 2 && strategyType === "STRICT") {
    strategyType = "BALANCED";
    reasons.push("最近执行度偏低，继续过严容易直接破功。");
  }

  const ranked = [...context.restaurants].sort(
    (a, b) => scoreRestaurant(b, { strategyType, candidates: [], reasons }, context.location?.name ?? null) -
      scoreRestaurant(a, { strategyType, candidates: [], reasons }, context.location?.name ?? null)
  );

  return {
    strategyType,
    candidates: ranked.slice(0, 5),
    reasons
  };
}
