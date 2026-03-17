import { NextResponse } from "next/server";
import { z } from "zod";

import { fromDateKey } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { generateRecommendation } from "@/lib/recommendation/service";
import { ensureDailyContext, getCurrentGoal, requirePrimaryUser } from "@/lib/server-core";

const schema = z.object({
  date: z.string().min(1),
  mealType: z.string().default("lunch")
});

export async function POST(request: Request) {
  const user = await requirePrimaryUser();
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const dailyContext = await ensureDailyContext(user.id, parsed.data.date);
  const goal = await getCurrentGoal(user.id);
  const location = dailyContext.currentLocationId
    ? await prisma.location.findUnique({ where: { id: dailyContext.currentLocationId } })
    : await prisma.location.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });

  const generated = await generateRecommendation({
    user,
    goal,
    location,
    dailyContext,
    mealType: parsed.data.mealType
  });

  const saved = await prisma.dailyRecommendation.upsert({
    where: {
      userId_date_mealType: {
        userId: user.id,
        date: fromDateKey(parsed.data.date),
        mealType: parsed.data.mealType
      }
    },
    update: {
      strategyType: generated.strategyType,
      restaurantId: generated.restaurantId,
      recommendedOrder: generated.recommendedOrder,
      fallbackOption: generated.fallbackOption,
      rationale: generated.rationale,
      narrativeLine: generated.narrativeLine,
      sourceType: generated.sourceType,
      rawContextJson: generated.rawContextJson
    },
    create: {
      userId: user.id,
      date: fromDateKey(parsed.data.date),
      mealType: parsed.data.mealType,
      strategyType: generated.strategyType,
      restaurantId: generated.restaurantId,
      recommendedOrder: generated.recommendedOrder,
      fallbackOption: generated.fallbackOption,
      rationale: generated.rationale,
      narrativeLine: generated.narrativeLine,
      sourceType: generated.sourceType,
      rawContextJson: generated.rawContextJson
    },
    include: {
      restaurant: true
    }
  });

  return NextResponse.json(saved);
}
