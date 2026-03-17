import type { DailyContext, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { generateRecommendation } from "@/lib/recommendation/service";
import { ensureDailyContext, getCurrentGoal, listLocations } from "@/lib/server-core";
import type {
  OpenClawDailyRecommendationResponse,
  OpenClawFeedbackPayload,
  OpenClawFeedbackResponse,
  OpenClawLocationEnrichmentResponse,
  OpenClawMemoryResponse
} from "@/types/openclaw";

const OPENCLAW_BASE_URL = process.env.OPENCLAW_BASE_URL?.trim();
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY?.trim();

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
    STRICT: "strict",
    BALANCED: "balanced",
    RELAXED: "relaxed",
    SOCIAL_COMP: "social_comp",
    RECOVERY: "recovery"
  };

  return map[strategyType] ?? "balanced";
}

function serializeOrderList(value: string) {
  return splitList(value.replace(/[。；;]/g, ","));
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

function buildVirtualContext(user: User, currentLocationId: string | null, date: Date): DailyContext {
  return {
    id: `virtual-${user.id}-${date.toISOString()}`,
    userId: user.id,
    date,
    currentLocationId,
    mood: "一般",
    disciplineLevel: "中",
    socialPlan: "今晚无社交",
    weightToday: null,
    stepsToday: null,
    sleepHours: null,
    weatherSummary: null,
    weatherTempC: null,
    lunarTag: null,
    solarTermTag: null,
    astroTag: null,
    notes: "",
    createdAt: date,
    updatedAt: date
  };
}

export async function pullMemory(userId: string): Promise<OpenClawMemoryResponse> {
  return callOpenClaw("/memory/pull", { userId }, async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        goals: { orderBy: { targetDate: "asc" } },
        locations: { orderBy: { createdAt: "asc" } },
        feedbacks: { orderBy: { date: "desc" }, take: 5, include: { restaurant: true } },
        dailyContexts: { orderBy: { date: "desc" }, take: 7 }
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
      })),
      recentContext: {
        recentRestaurants: user.feedbacks
          .map((feedback) => feedback.restaurant?.name)
          .filter((value): value is string => Boolean(value)),
        recentFeedback: user.feedbacks.flatMap((feedback) => splitList(feedback.notes)).slice(0, 6),
        bodyTrend: {
          weight: latestContext?.weightToday ? `${latestContext.weightToday}kg` : "unknown",
          steps: latestContext?.stepsToday ? `${latestContext.stepsToday}` : "unknown",
          sleep: latestContext?.sleepHours ? `${latestContext.sleepHours}h` : "unknown"
        }
      }
    };
  });
}

export async function enrichLocation(locationId: string): Promise<OpenClawLocationEnrichmentResponse> {
  return callOpenClaw("/location/enrich", { locationId }, async () => {
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: { restaurants: { orderBy: [{ updatedAt: "desc" }] } }
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
        avgPrice: `${Math.max(0, restaurant.avgPrice - 10)}-${restaurant.avgPrice + 10}`,
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

export async function pushDailyRecommendation(
  userId: string,
  date: string
): Promise<OpenClawDailyRecommendationResponse> {
  return callOpenClaw("/recommendation/push", { userId, date }, async () => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const [goal, locations, existingContext] = await Promise.all([
      getCurrentGoal(userId),
      listLocations(userId),
      ensureDailyContext(userId, date)
    ]);

    const location = existingContext.currentLocationId
      ? await prisma.location.findUnique({ where: { id: existingContext.currentLocationId } })
      : locations[0] ?? null;

    const dailyContext =
      existingContext ??
      buildVirtualContext(user, location?.id ?? null, new Date(date));

    const generated = await generateRecommendation({
      user,
      goal,
      location,
      dailyContext,
      mealType: "lunch"
    });

    const fallbackRestaurant = await prisma.restaurant.findFirst({
      where: {
        locationId: location?.id
      },
      orderBy: [{ healthyScore: "desc" }, { satietyScore: "desc" }]
    });

    return {
      userId,
      date,
      strategyType: toStrategyType(generated.strategyType),
      restaurant: generated.restaurantId
        ? {
            restaurantId: generated.restaurantId,
            name: generated.restaurantName
          }
        : null,
      recommendedOrder: serializeOrderList(generated.recommendedOrder),
      fallbackOption: fallbackRestaurant
        ? [
            {
              restaurantId: fallbackRestaurant.id,
              name: fallbackRestaurant.name,
              recommendedOrder: serializeOrderList(fallbackRestaurant.recommendedOrders)
            }
          ]
        : [],
      rationale: splitList(generated.rationale),
      narrativeLine: generated.narrativeLine
    };
  });
}

export async function pushFeedback(
  userId: string,
  payload: OpenClawFeedbackPayload
): Promise<OpenClawFeedbackResponse> {
  return callOpenClaw("/feedback/push", { userId, payload }, async () => ({
    userId,
    date: payload.date,
    accepted: true,
    feedbackType: payload.feedbackType ?? "general_feedback",
    storedPatch: payload.structuredPatch ?? {},
    summary: payload.rawText
  }));
}

export async function receiveOpenClawPush(payload: unknown) {
  return {
    status: "received",
    payload,
    message: "OpenClaw push payload received."
  };
}

export async function openClawChatEntry(input: { userId: string; message: string }) {
  return {
    status: "placeholder",
    userId: input.userId,
    message: input.message
  };
}
