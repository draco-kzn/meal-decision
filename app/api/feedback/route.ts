import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { listFeedback, requirePrimaryUser } from "@/lib/server-core";

const schema = z.object({
  date: z.string().min(1),
  restaurantId: z.string().nullable().optional(),
  adherenceLevel: z.string().default("中"),
  notes: z.string().default(""),
  imageUrl: z.string().nullable().optional()
});

export async function GET(request: Request) {
  const user = await requirePrimaryUser();
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 6);
  const feedbacks = await listFeedback(user.id, Number.isNaN(limit) ? 6 : limit);
  return NextResponse.json(feedbacks);
}

export async function POST(request: Request) {
  const user = await requirePrimaryUser();
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const feedback = await prisma.dailyFeedback.create({
    data: {
      userId: user.id,
      date: new Date(parsed.data.date),
      restaurantId: parsed.data.restaurantId ?? null,
      adherenceLevel: parsed.data.adherenceLevel,
      notes: parsed.data.notes,
      imageUrl: parsed.data.imageUrl ?? null
    }
  });

  return NextResponse.json(feedback);
}
