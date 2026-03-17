import type { DailyContext, Goal, Location, Restaurant, User } from "@prisma/client";

import type { StrategyType } from "@/types/domain";

export type RecommendationContext = {
  user: User;
  goal: Goal | null;
  location: Location | null;
  restaurants: Restaurant[];
  dailyContext: DailyContext;
  recentWeightTrendKg: number;
  recentLowAdherenceCount: number;
  mealType: string;
  dynamicSignals: {
    weatherSummary: string | null;
    weatherTempC: number | null;
    lunarTag: string | null;
    solarTermTag: string | null;
    astroTag: string | null;
  };
};

export type RuleEngineOutput = {
  strategyType: StrategyType;
  candidates: Restaurant[];
  reasons: string[];
};
