import { prisma } from "@/lib/prisma";

type EnrichedRestaurantPayload = {
  locationId: string;
  locationName?: string;
  restaurants: Array<{
    restaurantId?: string;
    name: string;
    cuisine: string;
    avgPrice?: string | number;
    walkTimeMin?: number;
    hours?: string;
    recommendedOrder?: string[] | string;
    riskTags?: string[] | string;
    source?: string;
    updatedAt?: string;
  }>;
};

type ImportedRecommendationPayload = {
  userId: string;
  date: string;
  mealType?: string;
  strategyType: string;
  restaurant?: {
    restaurantId?: string;
    name: string;
  } | null;
  recommendedOrder: string[] | string;
  fallbackOption?: unknown;
  rationale: string[] | string;
  narrativeLine: string;
  rawContextJson?: unknown;
};

type StructuredFeedbackPayload = {
  userId: string;
  date: string;
  restaurantId?: string | null;
  adherenceLevel?: string;
  notes?: string;
  imageUrl?: string | null;
};

function normalizeTextList(value: string[] | string | undefined) {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value.join("，") : value;
}

function parseAvgPrice(value: string | number | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (!value) {
    return 0;
  }

  const matched = value.match(/\d+/g);
  if (!matched?.length) {
    return 0;
  }

  const numbers = matched.map(Number);
  return numbers.reduce((sum, item) => sum + item, 0) / numbers.length;
}

export async function importEnrichedRestaurants(payload: EnrichedRestaurantPayload) {
  const results = [];

  for (const item of payload.restaurants) {
    const existing = item.restaurantId
      ? await prisma.restaurant.findUnique({ where: { id: item.restaurantId } }).catch(() => null)
      : await prisma.restaurant.findFirst({
          where: {
            locationId: payload.locationId,
            name: item.name
          }
        });

    const record = await prisma.restaurant.upsert({
      where: { id: existing?.id ?? item.restaurantId ?? `missing-${Math.random()}` },
      update: {
        locationId: payload.locationId,
        name: item.name,
        cuisine: item.cuisine,
        avgPrice: parseAvgPrice(item.avgPrice),
        openHours: item.hours ?? "",
        walkMinutes: item.walkTimeMin ?? 0,
        riskTags: normalizeTextList(item.riskTags),
        recommendedOrders: normalizeTextList(item.recommendedOrder),
        source: item.source ?? "openclaw-enrichment"
      },
      create: {
        locationId: payload.locationId,
        name: item.name,
        cuisine: item.cuisine,
        avgPrice: parseAvgPrice(item.avgPrice),
        openHours: item.hours ?? "",
        walkMinutes: item.walkTimeMin ?? 0,
        healthyScore: 70,
        satietyScore: 70,
        riskTags: normalizeTextList(item.riskTags),
        recommendedOrders: normalizeTextList(item.recommendedOrder),
        avoidOrders: "",
        notes: "",
        source: item.source ?? "openclaw-enrichment"
      }
    });

    results.push(record);
  }

  return results;
}

export async function importDailyRecommendation(payload: ImportedRecommendationPayload) {
  const restaurant =
    payload.restaurant?.restaurantId
      ? await prisma.restaurant.findUnique({ where: { id: payload.restaurant.restaurantId } })
      : payload.restaurant?.name
        ? await prisma.restaurant.findFirst({ where: { name: payload.restaurant.name } })
        : null;

  return prisma.dailyRecommendation.upsert({
    where: {
      userId_date_mealType: {
        userId: payload.userId,
        date: new Date(payload.date),
        mealType: payload.mealType ?? "lunch"
      }
    },
    update: {
      strategyType: payload.strategyType,
      restaurantId: restaurant?.id ?? null,
      recommendedOrder: normalizeTextList(payload.recommendedOrder),
      fallbackOption: JSON.stringify(payload.fallbackOption ?? []),
      rationale: normalizeTextList(payload.rationale),
      narrativeLine: payload.narrativeLine,
      sourceType: "OPENCLAW",
      rawContextJson: JSON.stringify(payload.rawContextJson ?? payload)
    },
    create: {
      userId: payload.userId,
      date: new Date(payload.date),
      mealType: payload.mealType ?? "lunch",
      strategyType: payload.strategyType,
      restaurantId: restaurant?.id ?? null,
      recommendedOrder: normalizeTextList(payload.recommendedOrder),
      fallbackOption: JSON.stringify(payload.fallbackOption ?? []),
      rationale: normalizeTextList(payload.rationale),
      narrativeLine: payload.narrativeLine,
      sourceType: "OPENCLAW",
      rawContextJson: JSON.stringify(payload.rawContextJson ?? payload)
    }
  });
}

export async function importStructuredFeedback(payload: StructuredFeedbackPayload) {
  return prisma.dailyFeedback.create({
    data: {
      userId: payload.userId,
      date: new Date(payload.date),
      restaurantId: payload.restaurantId ?? null,
      adherenceLevel: payload.adherenceLevel ?? "中",
      notes: payload.notes ?? "",
      imageUrl: payload.imageUrl ?? null
    }
  });
}
