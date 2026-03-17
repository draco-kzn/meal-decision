import type { DailyContext, Goal, Location, User } from "@prisma/client";

import { buildRecommendationContext } from "@/lib/recommendation/context-builder";
import { buildNarrative } from "@/lib/recommendation/narrative-builder";
import { runRuleEngine } from "@/lib/recommendation/rule-engine";
import type { RecommendationResult } from "@/types/domain";

type GenerateRecommendationParams = {
  user: User;
  goal: Goal | null;
  location: Location | null;
  dailyContext: DailyContext;
  mealType: string;
};

function buildOrder(strategyType: RecommendationResult["strategyType"], order: string) {
  if (strategyType === "STRICT") {
    return `${order}，主食减半，饮料改无糖。`;
  }

  if (strategyType === "RECOVERY") {
    return `${order}，优先热食和温和口味。`;
  }

  if (strategyType === "RELAXED") {
    return `${order}，允许保留一点满足感，但别再叠高风险小食。`;
  }

  return order;
}

function inferConfidence(params: {
  hasRestaurant: boolean;
  candidateCount: number;
  hasDynamicSignals: boolean;
}) {
  if (params.hasRestaurant && params.candidateCount >= 4 && params.hasDynamicSignals) {
    return "high" as const;
  }

  if (params.hasRestaurant && params.candidateCount >= 2) {
    return "medium" as const;
  }

  return "low" as const;
}

export async function generateRecommendation(params: GenerateRecommendationParams): Promise<RecommendationResult> {
  const context = await buildRecommendationContext(params);
  const ruleOutput = runRuleEngine(context);
  const recommendedRestaurant = ruleOutput.candidates[0] ?? null;
  const fallback = ruleOutput.candidates[1] ?? null;
  const narrative = buildNarrative(context, ruleOutput.strategyType, recommendedRestaurant?.name ?? null);
  const rawContextJson = JSON.stringify({
    userId: context.user.id,
    goalId: context.goal?.id ?? null,
    locationId: context.location?.id ?? null,
    mealType: context.mealType,
    dynamicSignals: context.dynamicSignals,
    ruleReasons: ruleOutput.reasons
  });

  return {
    strategyType: ruleOutput.strategyType,
    sourceType: "RULE_ENGINE",
    confidence: inferConfidence({
      hasRestaurant: Boolean(recommendedRestaurant),
      candidateCount: ruleOutput.candidates.length,
      hasDynamicSignals: Boolean(
        context.dynamicSignals.weatherSummary ||
          context.dynamicSignals.lunarTag ||
          context.dynamicSignals.solarTermTag ||
          context.dynamicSignals.astroTag
      )
    }),
    restaurantId: recommendedRestaurant?.id ?? null,
    restaurantName: recommendedRestaurant?.name ?? "高蛋白便当",
    recommendedOrder: recommendedRestaurant
      ? buildOrder(ruleOutput.strategyType, recommendedRestaurant.recommendedOrders)
      : "选择一份高蛋白便当加无糖热饮，先保底。",
    fallbackOption: fallback
      ? `${fallback.name}：${fallback.recommendedOrders}`
      : "如果附近都不合适，先用便利店高蛋白便当兜底。",
    rationale: [narrative.rationale, ...ruleOutput.reasons].join(" "),
    narrativeLine: narrative.narrativeLine,
    rawContextJson
  };
}
