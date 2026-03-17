import { NextResponse } from "next/server";
import { z } from "zod";

import { importEnrichedRestaurants } from "@/lib/recommendation/provider-adapters/openclaw";

const schema = z.object({
  locationId: z.string().min(1),
  locationName: z.string().optional(),
  restaurants: z.array(
    z.object({
      restaurantId: z.string().optional(),
      name: z.string().min(1),
      cuisine: z.string().min(1),
      avgPrice: z.union([z.number(), z.string()]).optional(),
      walkTimeMin: z.number().optional(),
      hours: z.string().optional(),
      recommendedOrder: z.union([z.array(z.string()), z.string()]).optional(),
      riskTags: z.union([z.array(z.string()), z.string()]).optional(),
      source: z.string().optional(),
      updatedAt: z.string().optional()
    })
  )
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await importEnrichedRestaurants(parsed.data);
  return NextResponse.json(result);
}
