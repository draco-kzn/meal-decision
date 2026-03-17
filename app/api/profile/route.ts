import { NextResponse } from "next/server";
import { z } from "zod";

import { getPrimaryUser } from "@/lib/server-core";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  nickname: z.string().min(1),
  heightCm: z.number(),
  weightKg: z.number(),
  targetWeightKg: z.number().nullable().optional(),
  dietPreferences: z.string(),
  restrictions: z.string(),
  budgetLevel: z.string(),
  toneStyle: z.string()
});

export async function GET() {
  const user = await getPrimaryUser();
  return NextResponse.json(user);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const current = await getPrimaryUser();
  const user = current
    ? await prisma.user.update({ where: { id: current.id }, data: parsed.data })
    : await prisma.user.create({ data: parsed.data });

  return NextResponse.json(user);
}
