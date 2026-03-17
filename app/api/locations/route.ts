import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { listLocations, requirePrimaryUser } from "@/lib/server-core";

const locationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  addressText: z.string().min(1),
  sceneTags: z.string().default(""),
  appearanceWindows: z.string().default(""),
  walkRadiusM: z.number(),
  notes: z.string().default("")
});

export async function GET() {
  const user = await requirePrimaryUser();
  const locations = await listLocations(user.id);
  return NextResponse.json(locations);
}

export async function POST(request: Request) {
  const user = await requirePrimaryUser();
  const body = await request.json();
  const parsed = locationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...rest } = parsed.data;
  const payload = { ...rest, userId: user.id };
  const location = id
    ? await prisma.location.update({ where: { id }, data: payload })
    : await prisma.location.create({ data: payload });

  return NextResponse.json(location);
}
