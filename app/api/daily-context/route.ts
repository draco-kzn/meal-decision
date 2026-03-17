import { NextResponse } from "next/server";
import { z } from "zod";

import { fromDateKey } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { getDailyContextByDate, requirePrimaryUser } from "@/lib/server-core";

const schema = z.object({
  date: z.string().min(1),
  currentLocationId: z.string().nullable().optional(),
  mood: z.string().default("一般"),
  disciplineLevel: z.string().default("中"),
  socialPlan: z.string().default("今晚无社交"),
  weightToday: z.number().nullable().optional(),
  stepsToday: z.number().nullable().optional(),
  sleepHours: z.number().nullable().optional(),
  weatherSummary: z.string().nullable().optional(),
  weatherTempC: z.number().nullable().optional(),
  lunarTag: z.string().nullable().optional(),
  solarTermTag: z.string().nullable().optional(),
  astroTag: z.string().nullable().optional(),
  notes: z.string().default("")
});

export async function GET(request: Request) {
  const user = await requirePrimaryUser();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const context = await getDailyContextByDate(user.id, date);
  return NextResponse.json(context);
}

export async function POST(request: Request) {
  const user = await requirePrimaryUser();
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const dailyContext = await prisma.dailyContext.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date: fromDateKey(parsed.data.date)
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

  return NextResponse.json(dailyContext);
}
