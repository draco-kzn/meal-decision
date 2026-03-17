import { NextResponse } from "next/server";
import { z } from "zod";

import { fromDateKey } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { findLocationByName, getDailyContextByDate, requirePrimaryUser } from "@/lib/server-core";

const schema = z.object({
  date: z.string().min(1),
  currentLocationId: z.string().nullable().optional(),
  locationName: z.string().optional(),
  mood: z.string().optional(),
  disciplineLevel: z.string().optional(),
  socialPlan: z.string().optional(),
  weightToday: z.number().nullable().optional(),
  stepsToday: z.number().nullable().optional(),
  sleepHours: z.number().nullable().optional(),
  weatherSummary: z.string().nullable().optional(),
  weatherTempC: z.number().nullable().optional(),
  lunarTag: z.string().nullable().optional(),
  solarTermTag: z.string().nullable().optional(),
  astroTag: z.string().nullable().optional(),
  notes: z.string().optional(),
  energy: z.string().optional(),
  wantsSpicy: z.boolean().optional(),
  socialTonight: z.boolean().optional()
});

function normalizeMood(input: { mood?: string; energy?: string }, fallback: string) {
  if (input.mood) {
    return input.mood;
  }

  if (input.energy === "low") {
    return "tired";
  }

  if (input.energy === "high") {
    return "energized";
  }

  return fallback;
}

function normalizeSocialPlan(input: { socialPlan?: string; socialTonight?: boolean }, fallback: string) {
  if (input.socialPlan) {
    return input.socialPlan;
  }

  if (input.socialTonight === true) {
    return "social tonight";
  }

  if (input.socialTonight === false) {
    return "none";
  }

  return fallback;
}

function normalizeNotes(input: { notes?: string; wantsSpicy?: boolean }, fallback: string) {
  const parts = [fallback];

  if (input.notes) {
    parts.push(input.notes);
  }

  if (input.wantsSpicy) {
    parts.push("wants_spicy");
  }

  return parts.filter(Boolean).join("\n").trim();
}

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

  const normalizedDate = fromDateKey(parsed.data.date);
  const existing = await prisma.dailyContext.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: normalizedDate
      }
    }
  });

  const location =
    parsed.data.currentLocationId
      ? await prisma.location.findUnique({ where: { id: parsed.data.currentLocationId } })
      : parsed.data.locationName
        ? await findLocationByName(user.id, parsed.data.locationName)
        : null;

  const payload = {
    currentLocationId: location?.id ?? existing?.currentLocationId ?? null,
    mood: normalizeMood(parsed.data, existing?.mood ?? "steady"),
    disciplineLevel: parsed.data.disciplineLevel ?? existing?.disciplineLevel ?? "medium",
    socialPlan: normalizeSocialPlan(parsed.data, existing?.socialPlan ?? "none"),
    weightToday: parsed.data.weightToday ?? existing?.weightToday ?? null,
    stepsToday: parsed.data.stepsToday ?? existing?.stepsToday ?? null,
    sleepHours: parsed.data.sleepHours ?? existing?.sleepHours ?? null,
    weatherSummary: parsed.data.weatherSummary ?? existing?.weatherSummary ?? null,
    weatherTempC: parsed.data.weatherTempC ?? existing?.weatherTempC ?? null,
    lunarTag: parsed.data.lunarTag ?? existing?.lunarTag ?? null,
    solarTermTag: parsed.data.solarTermTag ?? existing?.solarTermTag ?? null,
    astroTag: parsed.data.astroTag ?? existing?.astroTag ?? null,
    notes: normalizeNotes(parsed.data, existing?.notes ?? "")
  };

  const dailyContext = await prisma.dailyContext.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date: normalizedDate
      }
    },
    update: payload,
    create: {
      userId: user.id,
      date: normalizedDate,
      ...payload
    }
  });

  return NextResponse.json(dailyContext);
}
