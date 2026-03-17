export type StrategyType =
  | "STRICT_CONTROL"
  | "BALANCED"
  | "RELAXED"
  | "SOCIAL_COMPENSATION"
  | "RECOVERY";

export type RecommendationResult = {
  strategyType: StrategyType;
  restaurantId: string | null;
  restaurantName: string;
  recommendedOrder: string;
  fallbackOption: string;
  rationale: string;
  narrativeLine: string;
};
