import { prisma } from "@/lib/prisma";
import { fromDateKey, startOfDay } from "@/lib/date";

export async function getPrimaryUser() {
  return prisma.user.findFirst({
    orderBy: { createdAt: "asc" }
  });
}

export async function requirePrimaryUser() {
  const user = await getPrimaryUser();
  if (!user) {
    throw new Error("No user found.");
  }

  return user;
}

export async function getCurrentGoal(userId: string) {
  return prisma.goal.findFirst({
    where: { userId },
    orderBy: { targetDate: "asc" }
  });
}

export async function listLocations(userId: string) {
  return prisma.location.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" }
  });
}

export async function listRestaurants(locationId?: string | null) {
  return prisma.restaurant.findMany({
    where: locationId ? { locationId } : undefined,
    include: { location: true },
    orderBy: [{ createdAt: "asc" }]
  });
}

export async function getDailyContextByDate(userId: string, dateKey?: string | null) {
  return prisma.dailyContext.findUnique({
    where: {
      userId_date: {
        userId,
        date: fromDateKey(dateKey)
      }
    },
    include: {
      currentLocation: true
    }
  });
}

export async function getRecommendationByDate(userId: string, dateKey?: string | null, mealType = "lunch") {
  return prisma.dailyRecommendation.findUnique({
    where: {
      userId_date_mealType: {
        userId,
        date: fromDateKey(dateKey),
        mealType
      }
    },
    include: {
      restaurant: true
    }
  });
}

export async function listFeedback(userId: string, limit = 6) {
  return prisma.dailyFeedback.findMany({
    where: { userId },
    include: { restaurant: true },
    orderBy: { date: "desc" },
    take: limit
  });
}

export async function getDashboardSnapshot(userId: string, dateKey?: string | null) {
  const [user, goal, locations, restaurants, feedbacks, recommendation] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    getCurrentGoal(userId),
    listLocations(userId),
    listRestaurants(),
    listFeedback(userId, 5),
    getRecommendationByDate(userId, dateKey, "lunch")
  ]);

  return {
    user,
    goal,
    locations,
    restaurants,
    feedbacks,
    recommendation
  };
}

export async function ensureDailyContext(userId: string, dateKey?: string | null) {
  const date = fromDateKey(dateKey);
  const existing = await prisma.dailyContext.findUnique({
    where: {
      userId_date: {
        userId,
        date
      }
    }
  });

  if (existing) {
    return existing;
  }

  const firstLocation = await prisma.location.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" }
  });

  return prisma.dailyContext.create({
    data: {
      userId,
      date,
      currentLocationId: firstLocation?.id ?? null,
      mood: "一般",
      disciplineLevel: "中",
      socialPlan: "今晚无社交",
      notes: ""
    }
  });
}

export function normalizeDateInput(value?: string | null) {
  return startOfDay(fromDateKey(value));
}
