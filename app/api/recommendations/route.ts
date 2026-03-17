import { NextResponse } from "next/server";
import { z } from "zod";

import { fromDateKey } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { getRecommendationByDate, requirePrimaryUser } from "@/lib/server-core";

const schema = z.object({
  date: z.string().min(1),
  mealType: z.string().default("lunch"),
  strategyType: z.string().min(1),
  restaurantId: z.string().nullable().optional(),
  recommendedOrder: z.string().default(""),
  fallbackOption: z.string().default(""),
  rationale: z.string().default(""),
  narrativeLine: z.string().default(""),
  sourceType: z.string().default("RULE_ENGINE"),
  rawContextJson: z.string().default("{}")
});

export async function GET(request: Request) {
  const user = await requirePrimaryUser();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const mealType = searchParams.get("mealType") ?? "lunch";
  const recommendation = await getRecommendationByDate(user.id, date, mealType);
  return NextResponse.json(recommendation);
}

export async function POST(request: Request) {
  const user = await requirePrimaryUser();
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const recommendation = await prisma.dailyRecommendation.upsert({
    where: {
      userId_date_mealType: {
        userId: user.id,
        date: fromDateKey(parsed.data.date),
        mealType: parsed.data.mealType
      }
    },
    update: {
      ...parsed.data,
      date: fromDateKey(parsed.data.date)
    },
    create: {
      ...parsed.data,
      userId: user.id,
      date: fromDateKey(parsed.data.date)
    }
  });

  return NextResponse.json(recommendation);
}
