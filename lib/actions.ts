"use server";

import { revalidatePath } from "next/cache";

import { fromDateKey } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { generateRecommendation } from "@/lib/recommendation/service";
import { getCurrentGoal, requirePrimaryUser } from "@/lib/server-core";

export async function saveUserProfile(formData: FormData) {
  const current = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  const data = {
    nickname: String(formData.get("nickname") ?? ""),
    heightCm: Number(formData.get("heightCm") ?? 0),
    weightKg: Number(formData.get("weightKg") ?? 0),
    targetWeightKg: formData.get("targetWeightKg") ? Number(formData.get("targetWeightKg")) : null,
    dietPreferences: String(formData.get("dietPreferences") ?? ""),
    restrictions: String(formData.get("restrictions") ?? ""),
    budgetLevel: String(formData.get("budgetLevel") ?? "mid"),
    toneStyle: String(formData.get("toneStyle") ?? "温柔型")
  };

  if (current) {
    await prisma.user.update({ where: { id: current.id }, data });
  } else {
    await prisma.user.create({ data });
  }

  revalidatePath("/");
  revalidatePath("/profile");
}

export async function saveGoal(formData: FormData) {
  const user = await requirePrimaryUser();
  const id = String(formData.get("id") ?? "");
  const data = {
    userId: user.id,
    title: String(formData.get("title") ?? ""),
    goalType: String(formData.get("goalType") ?? "减脂"),
    targetDate: new Date(String(formData.get("targetDate") ?? new Date().toISOString())),
    intensity: String(formData.get("intensity") ?? "中等"),
    notes: String(formData.get("notes") ?? "")
  };

  if (id) {
    await prisma.goal.update({ where: { id }, data });
  } else {
    await prisma.goal.create({ data });
  }

  revalidatePath("/");
  revalidatePath("/goals");
}

export async function saveLocation(formData: FormData) {
  const user = await requirePrimaryUser();
  const id = String(formData.get("id") ?? "");
  const data = {
    userId: user.id,
    name: String(formData.get("name") ?? ""),
    addressText: String(formData.get("addressText") ?? ""),
    sceneTags: String(formData.get("sceneTags") ?? ""),
    appearanceWindows: String(formData.get("appearanceWindows") ?? ""),
    walkRadiusM: Number(formData.get("walkRadiusM") ?? 0),
    notes: String(formData.get("notes") ?? "")
  };

  if (id) {
    await prisma.location.update({ where: { id }, data });
  } else {
    await prisma.location.create({ data });
  }

  revalidatePath("/locations");
}

export async function saveRestaurant(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const data = {
    locationId: String(formData.get("locationId") ?? ""),
    name: String(formData.get("name") ?? ""),
    cuisine: String(formData.get("cuisine") ?? ""),
    avgPrice: Number(formData.get("avgPrice") ?? 0),
    openHours: String(formData.get("openHours") ?? ""),
    walkMinutes: Number(formData.get("walkMinutes") ?? 0),
    healthyScore: Number(formData.get("healthyScore") ?? 0),
    satietyScore: Number(formData.get("satietyScore") ?? 0),
    riskTags: String(formData.get("riskTags") ?? ""),
    recommendedOrders: String(formData.get("recommendedOrders") ?? ""),
    avoidOrders: String(formData.get("avoidOrders") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    source: String(formData.get("source") ?? "manual")
  };

  if (id) {
    await prisma.restaurant.update({ where: { id }, data });
  } else {
    await prisma.restaurant.create({ data });
  }

  revalidatePath("/restaurants");
}

export async function deleteRestaurant(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.restaurant.delete({ where: { id } });
  }
  revalidatePath("/restaurants");
}

export async function generateTodayRecommendationAction(formData: FormData) {
  const user = await requirePrimaryUser();
  const date = fromDateKey(String(formData.get("date") ?? new Date().toISOString()));
  const locationId = String(formData.get("currentLocationId") ?? "") || null;
  const mealType = String(formData.get("mealType") ?? "lunch");

  const context = await prisma.dailyContext.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date
      }
    },
    update: {
      currentLocationId: locationId,
      mood: String(formData.get("mood") ?? "一般"),
      disciplineLevel: String(formData.get("disciplineLevel") ?? "中"),
      socialPlan: String(formData.get("socialPlan") ?? "今晚无社交"),
      weightToday: formData.get("weightToday") ? Number(formData.get("weightToday")) : null,
      stepsToday: formData.get("stepsToday") ? Number(formData.get("stepsToday")) : null,
      sleepHours: formData.get("sleepHours") ? Number(formData.get("sleepHours")) : null,
      weatherSummary: String(formData.get("weatherSummary") ?? "") || null,
      notes: String(formData.get("notes") ?? "")
    },
    create: {
      userId: user.id,
      date,
      currentLocationId: locationId,
      mood: String(formData.get("mood") ?? "一般"),
      disciplineLevel: String(formData.get("disciplineLevel") ?? "中"),
      socialPlan: String(formData.get("socialPlan") ?? "今晚无社交"),
      weightToday: formData.get("weightToday") ? Number(formData.get("weightToday")) : null,
      stepsToday: formData.get("stepsToday") ? Number(formData.get("stepsToday")) : null,
      sleepHours: formData.get("sleepHours") ? Number(formData.get("sleepHours")) : null,
      weatherSummary: String(formData.get("weatherSummary") ?? "") || null,
      notes: String(formData.get("notes") ?? "")
    }
  });

  const [goal, location] = await Promise.all([
    getCurrentGoal(user.id),
    locationId ? prisma.location.findUnique({ where: { id: locationId } }) : null
  ]);

  const recommendation = await generateRecommendation({
    user,
    goal,
    location,
    dailyContext: context,
    mealType
  });

  await prisma.dailyRecommendation.upsert({
    where: {
      userId_date_mealType: {
        userId: user.id,
        date,
        mealType
      }
    },
    update: {
      strategyType: recommendation.strategyType,
      restaurantId: recommendation.restaurantId,
      recommendedOrder: recommendation.recommendedOrder,
      fallbackOption: recommendation.fallbackOption,
      rationale: recommendation.rationale,
      narrativeLine: recommendation.narrativeLine,
      sourceType: recommendation.sourceType,
      rawContextJson: recommendation.rawContextJson
    },
    create: {
      userId: user.id,
      date,
      mealType,
      strategyType: recommendation.strategyType,
      restaurantId: recommendation.restaurantId,
      recommendedOrder: recommendation.recommendedOrder,
      fallbackOption: recommendation.fallbackOption,
      rationale: recommendation.rationale,
      narrativeLine: recommendation.narrativeLine,
      sourceType: recommendation.sourceType,
      rawContextJson: recommendation.rawContextJson
    }
  });

  revalidatePath("/");
  revalidatePath("/today");
}

export async function saveFeedback(formData: FormData) {
  const user = await requirePrimaryUser();
  await prisma.dailyFeedback.create({
    data: {
      userId: user.id,
      date: new Date(String(formData.get("date") ?? new Date().toISOString())),
      restaurantId: String(formData.get("restaurantId") ?? "") || null,
      adherenceLevel: String(formData.get("adherenceLevel") ?? "中"),
      notes: String(formData.get("notes") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? "") || null
    }
  });

  revalidatePath("/feedback");
}
