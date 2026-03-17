import type { DailyContext, Goal, Location, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getAstroSignal } from "@/lib/recommendation/provider-adapters/astrology";
import { getLunarSignal } from "@/lib/recommendation/provider-adapters/lunar";
import { getWeatherSignal } from "@/lib/recommendation/provider-adapters/weather";
import type { RecommendationContext } from "@/lib/recommendation/types";

export async function getRecentWeightTrendKg(userId: string) {
  const rows = await prisma.dailyContext.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 7,
    select: { weightToday: true }
  });

  const valid = rows.map((row) => row.weightToday).filter((value): value is number => value !== null);
  if (valid.length < 2) {
    return 0;
  }

  return valid[0] - valid[valid.length - 1];
}

export async function getRecentLowAdherenceCount(userId: string) {
  return prisma.dailyFeedback.count({
    where: {
      userId,
      adherenceLevel: { in: ["low", "LOW", "低"] }
    }
  });
}

type BuildContextParams = {
  user: User;
  goal: Goal | null;
  location: Location | null;
  dailyContext: DailyContext;
  mealType: string;
};

export async function buildRecommendationContext({
  user,
  goal,
  location,
  dailyContext,
  mealType
}: BuildContextParams): Promise<RecommendationContext> {
  const [restaurants, recentWeightTrendKg, recentLowAdherenceCount, weatherSignal, lunarSignal, astroSignal] =
    await Promise.all([
      prisma.restaurant.findMany({
        where: location ? { locationId: location.id } : undefined,
        orderBy: [{ healthyScore: "desc" }, { satietyScore: "desc" }]
      }),
      getRecentWeightTrendKg(user.id),
      getRecentLowAdherenceCount(user.id),
      getWeatherSignal(dailyContext),
      getLunarSignal(dailyContext),
      getAstroSignal(dailyContext)
    ]);

  return {
    user,
    goal,
    location,
    restaurants,
    dailyContext,
    recentWeightTrendKg,
    recentLowAdherenceCount,
    mealType,
    dynamicSignals: {
      ...weatherSignal,
      ...lunarSignal,
      ...astroSignal
    }
  };
}
