"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { generateRecommendation } from "@/lib/recommendation-engine";
import { getWeightTrendKg } from "@/lib/data";

function startOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

async function getSingleUser() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    throw new Error("No user found. Seed the database or create a profile first.");
  }
  return user;
}

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
  const user = await getSingleUser();
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
  const user = await getSingleUser();
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

  revalidatePath("/");
  revalidatePath("/locations");
  revalidatePath("/restaurants");
  revalidatePath("/today");
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

  revalidatePath("/");
  revalidatePath("/restaurants");
  revalidatePath("/today");
}

export async function deleteRestaurant(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.restaurant.delete({ where: { id } });
  }
  revalidatePath("/restaurants");
  revalidatePath("/today");
}

export async function generateTodayRecommendationAction(formData: FormData) {
  const user = await getSingleUser();
  const date = startOfDay();
  const locationId = String(formData.get("currentLocationId") ?? "");
  const mealType = String(formData.get("mealType") ?? "lunch");

  const context = await prisma.dailyContext.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date
      }
    },
    update: {
      mood: String(formData.get("mood") ?? ""),
      disciplineLevel: String(formData.get("disciplineLevel") ?? "中"),
      socialPlan: String(formData.get("socialPlan") ?? ""),
      currentLocationId: locationId || null,
      weightToday: formData.get("weightToday") ? Number(formData.get("weightToday")) : null,
      stepsToday: formData.get("stepsToday") ? Number(formData.get("stepsToday")) : null,
      sleepHours: formData.get("sleepHours") ? Number(formData.get("sleepHours")) : null
    },
    create: {
      userId: user.id,
      date,
      mood: String(formData.get("mood") ?? ""),
      disciplineLevel: String(formData.get("disciplineLevel") ?? "中"),
      socialPlan: String(formData.get("socialPlan") ?? ""),
      currentLocationId: locationId || null,
      weightToday: formData.get("weightToday") ? Number(formData.get("weightToday")) : null,
      stepsToday: formData.get("stepsToday") ? Number(formData.get("stepsToday")) : null,
      sleepHours: formData.get("sleepHours") ? Number(formData.get("sleepHours")) : null
    }
  });

  const [goal, location, restaurants, recentWeightTrendKg] = await Promise.all([
    prisma.goal.findFirst({ where: { userId: user.id }, orderBy: { targetDate: "asc" } }),
    locationId ? prisma.location.findUnique({ where: { id: locationId } }) : Promise.resolve(null),
    prisma.restaurant.findMany({
      where: locationId ? { locationId } : undefined,
      orderBy: { healthyScore: "desc" }
    }),
    getWeightTrendKg(user.id)
  ]);

  const recommendation = generateRecommendation({
    user,
    goal,
    location,
    restaurants,
    todayContext: context,
    recentWeightTrendKg,
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
      narrativeLine: recommendation.narrativeLine
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
      narrativeLine: recommendation.narrativeLine
    }
  });

  revalidatePath("/");
  revalidatePath("/today");
}

export async function saveFeedback(formData: FormData) {
  const user = await getSingleUser();
  await prisma.dailyFeedback.create({
    data: {
      userId: user.id,
      date: formData.get("date") ? new Date(String(formData.get("date"))) : startOfDay(),
      restaurantId: String(formData.get("restaurantId") ?? "") || null,
      adherenceLevel: String(formData.get("adherenceLevel") ?? "中"),
      notes: String(formData.get("notes") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? "")
    }
  });

  revalidatePath("/");
  revalidatePath("/feedback");
}
