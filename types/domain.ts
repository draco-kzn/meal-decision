export type StrategyType = "STRICT" | "BALANCED" | "RELAXED" | "SOCIAL_COMP" | "RECOVERY";

export type RecommendationSourceType = "RULE_ENGINE" | "OPENCLAW" | "HYBRID";

export type RecommendationResult = {
  strategyType: StrategyType;
  sourceType: RecommendationSourceType;
  restaurantId: string | null;
  restaurantName: string;
  recommendedOrder: string;
  fallbackOption: string;
  rationale: string;
  narrativeLine: string;
  rawContextJson: string;
};
