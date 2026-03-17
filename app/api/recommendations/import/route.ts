import { NextResponse } from "next/server";
import { z } from "zod";

import { importDailyRecommendation } from "@/lib/recommendation/provider-adapters/openclaw";

const schema = z.object({
  userId: z.string().min(1),
  date: z.string().min(1),
  mealType: z.string().optional(),
  strategyType: z.string().min(1),
  restaurant: z
    .object({
      restaurantId: z.string().optional(),
      name: z.string()
    })
    .nullable()
    .optional(),
  recommendedOrder: z.union([z.array(z.string()), z.string()]),
  fallbackOption: z.any().optional(),
  rationale: z.union([z.array(z.string()), z.string()]),
  narrativeLine: z.string().min(1),
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
