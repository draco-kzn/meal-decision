import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { listRestaurants, requirePrimaryUser } from "@/lib/server-core";

const restaurantSchema = z.object({
  id: z.string().optional(),
  locationId: z.string().min(1),
  name: z.string().min(1),
  cuisine: z.string().min(1),
  avgPrice: z.number(),
  openHours: z.string().default(""),
  walkMinutes: z.number(),
  healthyScore: z.number(),
  satietyScore: z.number(),
  riskTags: z.string().default(""),
  recommendedOrders: z.string().default(""),
  avoidOrders: z.string().default(""),
  notes: z.string().default(""),
  source: z.string().default("manual"),
  enrichmentConfidence: z.string().default("medium")
});

export async function GET(request: Request) {
  const user = await requirePrimaryUser();
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");
  const restaurants = await listRestaurants(locationId, user.id);
  return NextResponse.json(restaurants);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = restaurantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...rest } = parsed.data;
  const restaurant = id
    ? await prisma.restaurant.update({ where: { id }, data: rest })
    : await prisma.restaurant.create({ data: rest });

  return NextResponse.json(restaurant);
}
