import type { Restaurant } from "@prisma/client";

import type { RuleEngineOutput } from "@/lib/recommendation/types";

function daysUntil(targetDate: Date | null) {
  if (!targetDate) {
    return 30;
  }

  const diff = targetDate.getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
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

  if (output.strategyType === "RECOVERY" && /粥|汤|轻食|沙拉/.test(restaurant.cuisine)) {
    score += 18;
  }

  return score;
}

export function runRuleEngine(context: import("@/lib/recommendation/types").RecommendationContext): RuleEngineOutput {
  const daysLeft = daysUntil(context.goal?.targetDate ?? null);
  const moodLow = /累|差|烦|低落/.test(context.dailyContext.mood);
  const disciplineHigh = context.dailyContext.disciplineLevel === "高";
  const socialTonight = /社交|聚餐|约会/.test(context.dailyContext.socialPlan);
  const weightUp = context.recentWeightTrendKg > 0.4;
  const poorSleep = (context.dailyContext.sleepHours ?? 7) < 6;

  const reasons: string[] = [];
  let strategyType: RuleEngineOutput["strategyType"] = "BALANCED";

  if (daysLeft <= 14) {
    strategyType = "STRICT";
    reasons.push("距离目标日期已经很近，今天需要提高节制权重。");
  }

  if (weightUp && disciplineHigh) {
    strategyType = "STRICT";
    reasons.push("最近 7 日体重有上升，自律意愿又较高，适合更稳一点。");
  }

  if (socialTonight && context.mealType === "lunch") {
    strategyType = "SOCIAL_COMP";
    reasons.push("今晚有社交安排，中午建议提前做补偿，给晚上留出弹性。");
  }

  if (poorSleep && moodLow) {
    strategyType = "RECOVERY";
    reasons.push("睡眠不足且心情偏低，今天更适合恢复型方案。");
  }

  if (moodLow && !disciplineHigh && strategyType === "BALANCED") {
    strategyType = "RELAXED";
    reasons.push("今天状态一般，允许一点满足感，但仍然需要控制边界。");
  }

  if (context.recentLowAdherenceCount >= 2 && strategyType === "STRICT") {
    strategyType = "BALANCED";
    reasons.push("最近执行度偏低，继续极端严格反而不利于执行。");
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
