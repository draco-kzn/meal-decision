import { prisma } from "@/lib/prisma";

function startOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export async function getBootstrapData() {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" }
  });

  if (!user) {
    return {
      user: null,
      goal: null,
      locations: [],
      restaurants: [],
      todayContext: null,
      todayRecommendation: null,
      feedbacks: []
    };
  }

  const [goal, locations, restaurants, todayContext, todayRecommendation, feedbacks] = await Promise.all([
    prisma.goal.findFirst({
      where: { userId: user.id },
      orderBy: { targetDate: "asc" }
    }),
    prisma.location.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" }
    }),
    prisma.restaurant.findMany({
      orderBy: [{ location: { createdAt: "asc" } }, { createdAt: "asc" }],
      include: { location: true }
    }),
    prisma.dailyContext.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: startOfDay()
        }
      },
      include: { currentLocation: true }
    }),
    prisma.dailyRecommendation.findFirst({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      include: { restaurant: true }
    }),
    prisma.dailyFeedback.findMany({
      where: { userId: user.id },
      include: { restaurant: true },
      orderBy: { date: "desc" },
      take: 6
    })
  ]);

  return { user, goal, locations, restaurants, todayContext, todayRecommendation, feedbacks };
}

export async function getWeightTrendKg(userId: string) {
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
