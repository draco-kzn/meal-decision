import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requirePrimaryUser } from "@/lib/server-core";

const goalSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  goalType: z.string().min(1),
  targetDate: z.string().min(1),
  intensity: z.string().min(1),
  notes: z.string().default("")
});

export async function POST(request: Request) {
  const user = await requirePrimaryUser();
  const body = await request.json();
  const parsed = goalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...rest } = parsed.data;
  const payload = {
    userId: user.id,
    title: rest.title,
    goalType: rest.goalType,
    targetDate: new Date(rest.targetDate),
    intensity: rest.intensity,
    notes: rest.notes
  };

  const goal = id
    ? await prisma.goal.update({ where: { id }, data: payload })
    : await prisma.goal.create({ data: payload });

  return NextResponse.json(goal);
}
