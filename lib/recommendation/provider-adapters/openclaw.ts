import { prisma } from "@/lib/prisma";
import { fromDateKey } from "@/lib/date";
import { syncLocationCoverageStatus } from "@/lib/location-coverage";
import { findLocationByName, findRestaurantByName, getPrimaryUser, requirePrimaryUser } from "@/lib/server-core";

type EnrichedRestaurantItem = {
  restaurantId?: string;
  name: string;
  cuisine?: string;
  avgPrice?: string | number;
  walkTimeMin?: number;
  walkMinutes?: number;
  hours?: string;
  openHours?: string;
  recommendedOrder?: string[] | string;
  recommendedOrders?: string[] | string;
  avoidOrders?: string[] | string;
  riskTags?: string[] | string;
  notes?: string;
  source?: string[] | string;
  updatedAt?: string;
  enrichmentConfidence?: string;
};

type EnrichedRestaurantPayload = {
  locationId?: string;
  locationName?: string;
  restaurants: EnrichedRestaurantItem[];
};

type ImportedRecommendationPayload = {
  userId?: string;
  date: string;
  mealType?: string;
  strategyType: string;
  locationName?: string;
  restaurantName?: string;
  restaurant?: {
    restaurantId?: string;
    name: string;
  } | null;
  recommendedOrder: string[] | string;
  fallbackOption?: unknown;
  rationale: string[] | string;
  narrativeLine: string;
  sourceType?: string;
  confidence?: string;
  rawContextJson?: unknown;
};

type StructuredFeedbackPayload = {
  userId?: string;
  date: string;
  feedbackType?: string;
  rawText?: string;
  structuredPatch?: Record<string, string | number | boolean | null>;
  restaurantId?: string | null;
  restaurantName?: string | null;
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

function normalizeSource(value: string[] | string | undefined) {
  if (!value) {
    return "openclaw-enrichment";
  }

  return Array.isArray(value) ? value.join("\n") : value;
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

function normalizeStructuredPatch(
  value: Record<string, string | number | boolean | null> | undefined
): Record<string, string | number | boolean | null> {
  return value ?? {};
}

function inferAdherenceLevel(feedbackType: string, structuredPatch: Record<string, string | number | boolean | null>) {
  const patchText = JSON.stringify(structuredPatch).toLowerCase();
  if (/messed up|binge|broke plan|破功|放纵/.test(patchText)) {
    return "low";
  }

  if (feedbackType === "direct_feedback") {
    return "medium";
  }

  return "medium";
}

async function resolveLocation(payload: { userId: string; locationId?: string; locationName?: string }) {
  if (payload.locationId) {
    return prisma.location.findUnique({ where: { id: payload.locationId } });
  }

  if (payload.locationName) {
    return findLocationByName(payload.userId, payload.locationName);
  }

  return null;
}

export async function importEnrichedRestaurants(payload: EnrichedRestaurantPayload) {
  const user = await requirePrimaryUser();
  const location = await resolveLocation({
    userId: user.id,
    locationId: payload.locationId,
    locationName: payload.locationName
  });

  if (!location) {
    throw new Error("Location not found for enrichment payload.");
  }

  const results = [];

  for (const item of payload.restaurants) {
    const existing = item.restaurantId
      ? await prisma.restaurant.findUnique({ where: { id: item.restaurantId } })
      : await prisma.restaurant.findFirst({
          where: {
            locationId: location.id,
            name: item.name
          }
        });

    const data = {
      locationId: location.id,
      name: item.name,
      cuisine: item.cuisine ?? "unknown",
      avgPrice: parseAvgPrice(item.avgPrice),
      openHours: item.openHours ?? item.hours ?? "unknown",
      walkMinutes: item.walkMinutes ?? item.walkTimeMin ?? 0,
      healthyScore: existing?.healthyScore ?? 70,
      satietyScore: existing?.satietyScore ?? 70,
      riskTags: normalizeTextList(item.riskTags),
      recommendedOrders: normalizeTextList(item.recommendedOrders ?? item.recommendedOrder),
      avoidOrders: normalizeTextList(item.avoidOrders),
      notes: item.notes ?? existing?.notes ?? "",
      source: normalizeSource(item.source),
      enrichmentConfidence: item.enrichmentConfidence ?? "medium"
    };

    const record = existing
      ? await prisma.restaurant.update({
          where: { id: existing.id },
          data
        })
      : await prisma.restaurant.create({
          data
        });

    results.push(record);
  }

  const coverage = await syncLocationCoverageStatus(location.id);

  return {
    locationId: location.id,
    locationName: location.name,
    coverageStatus: coverage.coverageStatus,
    suggestedNextStep: coverage.suggestedNextStep,
    restaurants: results
  };
}

export async function importDailyRecommendation(payload: ImportedRecommendationPayload) {
  const user = payload.userId
    ? await prisma.user.findUnique({ where: { id: payload.userId } })
    : await getPrimaryUser();

  if (!user) {
    throw new Error("No user found for recommendation import.");
  }

  const location = payload.locationName ? await findLocationByName(user.id, payload.locationName) : null;
  const restaurant =
    payload.restaurant?.restaurantId
      ? await prisma.restaurant.findUnique({ where: { id: payload.restaurant.restaurantId } })
      : payload.restaurant?.name || payload.restaurantName
        ? await findRestaurantByName(
            user.id,
            payload.restaurant?.name ?? payload.restaurantName ?? "",
            location?.id ?? null
          )
        : null;

  return prisma.dailyRecommendation.upsert({
    where: {
      userId_date_mealType: {
        userId: user.id,
        date: fromDateKey(payload.date),
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
      sourceType: payload.sourceType ?? "OPENCLAW",
      confidence: payload.confidence ?? "medium",
      rawContextJson: JSON.stringify(payload.rawContextJson ?? payload)
    },
    create: {
      userId: user.id,
      date: fromDateKey(payload.date),
      mealType: payload.mealType ?? "lunch",
      strategyType: payload.strategyType,
      restaurantId: restaurant?.id ?? null,
      recommendedOrder: normalizeTextList(payload.recommendedOrder),
      fallbackOption: JSON.stringify(payload.fallbackOption ?? []),
      rationale: normalizeTextList(payload.rationale),
      narrativeLine: payload.narrativeLine,
      sourceType: payload.sourceType ?? "OPENCLAW",
      confidence: payload.confidence ?? "medium",
      rawContextJson: JSON.stringify(payload.rawContextJson ?? payload)
    },
    include: {
      restaurant: {
        include: {
          location: true
        }
      }
    }
  });
}

export async function importStructuredFeedback(payload: StructuredFeedbackPayload) {
  const user = payload.userId
    ? await prisma.user.findUnique({ where: { id: payload.userId } })
    : await getPrimaryUser();

  if (!user) {
    throw new Error("No user found for feedback import.");
  }

  const structuredPatch = normalizeStructuredPatch(payload.structuredPatch);
  const locationName =
    typeof structuredPatch.locationName === "string" ? structuredPatch.locationName : undefined;
  const location = locationName ? await findLocationByName(user.id, locationName) : null;
  const restaurant =
    payload.restaurantId
      ? await prisma.restaurant.findUnique({ where: { id: payload.restaurantId } })
      : payload.restaurantName
        ? await findRestaurantByName(user.id, payload.restaurantName, location?.id ?? null)
        : null;

  let dailyContext = null;
  const feedbackType = payload.feedbackType ?? "direct_feedback";

  if (feedbackType === "daily_context") {
    const existingContext = await prisma.dailyContext.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: fromDateKey(payload.date)
        }
      }
    });

    const energy = structuredPatch.energy;
    const mood =
      typeof energy === "string"
        ? energy === "low"
          ? "tired"
          : energy === "high"
            ? "energized"
            : existingContext?.mood ?? "steady"
        : existingContext?.mood ?? "steady";

    const socialTonight = structuredPatch.socialTonight;
    const socialPlan =
      typeof socialTonight === "boolean"
        ? socialTonight
          ? "social tonight"
          : "none"
        : existingContext?.socialPlan ?? "none";

    const extraNotes = [];
    if (structuredPatch.wantsSpicy === true) {
      extraNotes.push("wants_spicy");
    }
    if (payload.rawText) {
      extraNotes.push(payload.rawText);
    }

    dailyContext = await prisma.dailyContext.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: fromDateKey(payload.date)
        }
      },
      update: {
        currentLocationId: location?.id ?? existingContext?.currentLocationId ?? null,
        mood,
        socialPlan,
        notes: [existingContext?.notes ?? "", ...extraNotes].filter(Boolean).join("\n").trim()
      },
      create: {
        userId: user.id,
        date: fromDateKey(payload.date),
        currentLocationId: location?.id ?? null,
        mood,
        disciplineLevel: "medium",
        socialPlan,
        notes: extraNotes.join("\n")
      }
    });
  }

  const feedback = await prisma.dailyFeedback.create({
    data: {
      userId: user.id,
      date: fromDateKey(payload.date),
      restaurantId: restaurant?.id ?? null,
      feedbackType,
      adherenceLevel: payload.adherenceLevel ?? inferAdherenceLevel(feedbackType, structuredPatch),
      notes: payload.notes ?? payload.rawText ?? "",
      imageUrl: payload.imageUrl ?? null,
      structuredPatchJson: JSON.stringify(structuredPatch)
    },
    include: {
      restaurant: true
    }
  });

  return {
    feedback,
    dailyContext
  };
}
