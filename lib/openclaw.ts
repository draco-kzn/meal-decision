import type { DailyContext, Restaurant, User } from "@prisma/client";

import { getWeightTrendKg } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { generateRecommendation } from "@/lib/recommendation-engine";
import type {
  OpenClawDailyRecommendationResponse,
  OpenClawFeedbackPayload,
  OpenClawFeedbackResponse,
  OpenClawLocationEnrichmentResponse,
  OpenClawMemoryResponse
} from "@/types/openclaw";

const OPENCLAW_BASE_URL = process.env.OPENCLAW_BASE_URL?.trim();
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY?.trim();

function startOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function splitList(value: string) {
  return value
    .split(/[，,、/\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toTonePreference(toneStyle: string) {
  const map: Record<string, string> = {
    教练型: "coach-direct",
    温柔型: "gentle-practical",
    玄学型: "mystic-playful",
    毒舌型: "sharp-direct"
  };

  return map[toneStyle] ?? "gentle-practical";
}

function toStrategyType(strategyType: string) {
  const map: Record<string, string> = {
    STRICT_CONTROL: "strict_control",
    BALANCED: "balanced",
    RELAXED: "relaxed",
    SOCIAL_COMPENSATION: "social_compensation",
    RECOVERY: "recovery"
  };

  return map[strategyType] ?? "balanced";
}

function formatBodyTrend(value: number | null | undefined, unit: string) {
  if (value === null || value === undefined) {
    return "unknown";
  }

  return `${value}${unit}`;
}

function serializeOrderList(value: string) {
  return splitList(value.replace(/[。；;]/g, ","));
}

function toAvgPriceBand(avgPrice: number) {
  const low = Math.max(0, Math.floor(avgPrice / 10) * 10);
  const high = low + 20;
  return `${low}-${high}`;
}

async function callOpenClaw<T>(path: string, body: object, fallback: () => Promise<T>): Promise<T> {
  if (!OPENCLAW_BASE_URL) {
    return fallback();
  }

  const response = await fetch(`${OPENCLAW_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(OPENCLAW_API_KEY ? { Authorization: `Bearer ${OPENCLAW_API_KEY}` } : {})
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`OpenClaw request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function pullMemory(userId: string): Promise<OpenClawMemoryResponse> {
  return callOpenClaw("/memory/pull", { userId }, async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        goals: { orderBy: { targetDate: "asc" } },
        locations: { orderBy: { createdAt: "asc" } },
        feedbacks: {
          orderBy: { date: "desc" },
          take: 5,
          include: { restaurant: true }
        },
        dailyContexts: {
          orderBy: { date: "desc" },
          take: 7
        }
      }
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const latestContext = user.dailyContexts[0] ?? null;

    return {
      userId: user.id,
      profile: {
        dietPreferences: splitList(user.dietPreferences),
        dietRestrictions: splitList(user.restrictions),
        budgetPreference: user.budgetLevel,
        tonePreference: toTonePreference(user.toneStyle)
      },
      goals: user.goals.map((goal) => ({
        title: goal.title,
        type: goal.goalType,
        targetDate: goal.targetDate.toISOString().slice(0, 10),
        intensity: goal.intensity
      })),
      locations: user.locations.map((location) => ({
        locationId: location.id,
        name: location.name,
        walkRadiusMin: Math.max(1, Math.round(location.walkRadiusM / 80)),
        specialRules: splitList(location.notes)
          .map((item) => item.toLowerCase().replace(/\s+/g, "_"))
          .slice(0, 4)
      })),
      recentContext: {
        recentRestaurants: user.feedbacks
          .map((feedback) => feedback.restaurant?.name)
          .filter((value): value is string => Boolean(value)),
        recentFeedback: user.feedbacks
          .flatMap((feedback) => splitList(feedback.notes))
          .slice(0, 6),
        bodyTrend: {
          weight: formatBodyTrend(latestContext?.weightToday, "kg"),
          steps: formatBodyTrend(latestContext?.stepsToday, " steps"),
          sleep: formatBodyTrend(latestContext?.sleepHours, "h")
        }
      }
    };
  });
}

export async function enrichLocation(locationId: string): Promise<OpenClawLocationEnrichmentResponse> {
  return callOpenClaw("/location/enrich", { locationId }, async () => {
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: {
        restaurants: {
          orderBy: [{ updatedAt: "desc" }, { healthyScore: "desc" }]
        }
      }
    });

    if (!location) {
      throw new Error(`Location ${locationId} not found`);
    }

    return {
      locationId: location.id,
      locationName: location.name,
      restaurants: location.restaurants.map((restaurant) => ({
        restaurantId: restaurant.id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        avgPrice: toAvgPriceBand(restaurant.avgPrice),
        walkTimeMin: restaurant.walkMinutes,
        hours: restaurant.openHours,
        recommendedOrder: serializeOrderList(restaurant.recommendedOrders),
        riskTags: splitList(restaurant.riskTags),
        source: restaurant.source,
        updatedAt: restaurant.updatedAt.toISOString().slice(0, 10)
      }))
    };
  });
}

function buildVirtualContext(user: User, currentLocationId: string | null, date: Date): DailyContext {
  return {
    id: `virtual-${user.id}-${date.toISOString()}`,
    userId: user.id,
    date,
    mood: "一般",
    disciplineLevel: "中",
    socialPlan: "今晚无社交",
    currentLocationId,
    weightToday: null,
    stepsToday: null,
    sleepHours: null,
    createdAt: date,
    updatedAt: date
  };
}

function pickFallbackRestaurants(restaurants: Restaurant[], chosenId: string | null) {
  return restaurants
    .filter((restaurant) => restaurant.id !== chosenId)
    .sort((a, b) => b.healthyScore + b.satietyScore - (a.healthyScore + a.satietyScore))
    .slice(0, 2);
}

function serializeRationale(value: string) {
  return value
    .split(/(?<=[。！？])\s*|\s(?=[A-Z\u4e00-\u9fa5])/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function pushDailyRecommendation(
  userId: string,
  date: string
): Promise<OpenClawDailyRecommendationResponse> {
  return callOpenClaw("/recommendation/push", { userId, date }, async () => {
    const targetDate = startOfDay(new Date(date));
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const [goal, locations, contextFromDb, recentWeightTrendKg] = await Promise.all([
      prisma.goal.findFirst({
        where: { userId },
        orderBy: { targetDate: "asc" }
      }),
      prisma.location.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" }
      }),
      prisma.dailyContext.findUnique({
        where: {
          userId_date: {
            userId,
            date: targetDate
          }
        }
      }),
      getWeightTrendKg(userId)
    ]);

    const location = contextFromDb?.currentLocationId
      ? await prisma.location.findUnique({ where: { id: contextFromDb.currentLocationId } })
      : locations[0] ?? null;
    const todayContext = contextFromDb ?? buildVirtualContext(user, location?.id ?? null, targetDate);
    const restaurants = await prisma.restaurant.findMany({
      where: location ? { locationId: location.id } : undefined,
      orderBy: [{ healthyScore: "desc" }, { satietyScore: "desc" }]
    });

    const generated = generateRecommendation({
      user,
      goal,
      location,
      restaurants,
      todayContext,
      recentWeightTrendKg,
      mealType: "lunch"
    });

    await prisma.dailyRecommendation.upsert({
      where: {
        userId_date_mealType: {
          userId,
          date: targetDate,
          mealType: "lunch"
        }
      },
      update: {
        strategyType: generated.strategyType,
        restaurantId: generated.restaurantId,
        recommendedOrder: generated.recommendedOrder,
        fallbackOption: generated.fallbackOption,
        rationale: generated.rationale,
        narrativeLine: generated.narrativeLine
      },
      create: {
        userId,
        date: targetDate,
        mealType: "lunch",
        strategyType: generated.strategyType,
        restaurantId: generated.restaurantId,
        recommendedOrder: generated.recommendedOrder,
        fallbackOption: generated.fallbackOption,
        rationale: generated.rationale,
        narrativeLine: generated.narrativeLine
      }
    });

    const recommendedRestaurant =
      restaurants.find((restaurant) => restaurant.id === generated.restaurantId) ?? null;
    const fallbackRestaurants = pickFallbackRestaurants(restaurants, generated.restaurantId);

    return {
      userId,
      date: targetDate.toISOString().slice(0, 10),
      strategyType: toStrategyType(generated.strategyType),
      restaurant: recommendedRestaurant
        ? {
            restaurantId: recommendedRestaurant.id,
            name: recommendedRestaurant.name
          }
        : null,
      recommendedOrder: serializeOrderList(generated.recommendedOrder),
      fallbackOption: fallbackRestaurants.map((restaurant) => ({
        restaurantId: restaurant.id,
        name: restaurant.name,
        recommendedOrder: serializeOrderList(restaurant.recommendedOrders)
      })),
      rationale: serializeRationale(generated.rationale),
      narrativeLine: generated.narrativeLine
    };
  });
}

export async function pushFeedback(
  userId: string,
  payload: OpenClawFeedbackPayload
): Promise<OpenClawFeedbackResponse> {
  return callOpenClaw("/feedback/push", { userId, payload }, async () => {
    return {
      userId,
      date: payload.date,
      accepted: true,
      feedbackType: payload.feedbackType ?? "general_feedback",
      storedPatch: payload.structuredPatch ?? {},
      summary: payload.rawText
    };
  });
}

export async function receiveOpenClawPush(payload: unknown) {
  return {
    status: "received",
    payload,
    message: "OpenClaw push payload received. Route can now be expanded into a real webhook handler."
  };
}

export async function openClawChatEntry(input: { userId: string; message: string }) {
  return {
    status: "placeholder",
    userId: input.userId,
    message: input.message,
    hint: "Future hook for routing natural-language requests to OpenClaw chat."
  };
}
