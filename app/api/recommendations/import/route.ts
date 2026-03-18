import { NextResponse } from "next/server";
import { z } from "zod";

import { importDailyRecommendation } from "@/lib/recommendation/provider-adapters/openclaw";

const fallbackOptionSchema = z.object({
  restaurantId: z.string().optional(),
  restaurantName: z.string().optional(),
  name: z.string().optional(),
  recommendedOrder: z.union([z.array(z.string()), z.string()]).optional()
});

const schema = z.object({
  userId: z.string().optional(),
  date: z.string().min(1),
  mealType: z.string().default("lunch"),
  strategyType: z.string().min(1),
  locationId: z.string().optional(),
  locationName: z.string().optional(),
  restaurantId: z.string().optional(),
  restaurantName: z.string().optional(),
  restaurant: z
    .object({
      restaurantId: z.string().optional(),
      name: z.string()
    })
    .nullable()
    .optional(),
  recommendedOrder: z.union([z.array(z.string()), z.string()]),
  fallbackOption: z.union([z.array(fallbackOptionSchema), z.string(), z.any()]).optional(),
  rationale: z.union([z.array(z.string()), z.string()]),
  narrativeLine: z.string().min(1),
  sourceType: z.string().default("OPENCLAW"),
  confidence: z.string().default("medium"),
  rawContextJson: z.any().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await importDailyRecommendation(parsed.data);
  return NextResponse.json(result);
}
