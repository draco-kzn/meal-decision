import { NextResponse } from "next/server";
import { z } from "zod";

import { importEnrichedRestaurants } from "@/lib/recommendation/provider-adapters/openclaw";

const restaurantItemSchema = z.object({
  restaurantId: z.string().optional(),
  name: z.string().min(1),
  cuisine: z.string().optional(),
  avgPrice: z.union([z.number(), z.string()]).optional(),
  walkTimeMin: z.number().optional(),
  walkMinutes: z.number().optional(),
  hours: z.string().optional(),
  openHours: z.string().optional(),
  recommendedOrder: z.union([z.array(z.string()), z.string()]).optional(),
  recommendedOrders: z.union([z.array(z.string()), z.string()]).optional(),
  avoidOrders: z.union([z.array(z.string()), z.string()]).optional(),
  riskTags: z.union([z.array(z.string()), z.string()]).optional(),
  notes: z.string().optional(),
  source: z.union([z.array(z.string()), z.string()]).optional(),
  updatedAt: z.string().optional(),
  enrichmentConfidence: z.string().optional()
});

const batchSchema = z.object({
  locationId: z.string().optional(),
  locationName: z.string().optional(),
  restaurants: z.array(restaurantItemSchema).min(1)
});

const singleSchema = z.object({
  locationId: z.string().optional(),
  locationName: z.string().optional(),
  name: z.string().min(1),
  cuisine: z.string().optional(),
  avgPrice: z.union([z.number(), z.string()]).optional(),
  walkTimeMin: z.number().optional(),
  walkMinutes: z.number().optional(),
  hours: z.string().optional(),
  openHours: z.string().optional(),
  recommendedOrder: z.union([z.array(z.string()), z.string()]).optional(),
  recommendedOrders: z.union([z.array(z.string()), z.string()]).optional(),
  avoidOrders: z.union([z.array(z.string()), z.string()]).optional(),
  riskTags: z.union([z.array(z.string()), z.string()]).optional(),
  notes: z.string().optional(),
  source: z.union([z.array(z.string()), z.string()]).optional(),
  updatedAt: z.string().optional(),
  enrichmentConfidence: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsedBatch = batchSchema.safeParse(body);
  const parsedSingle = parsedBatch.success ? undefined : singleSchema.safeParse(body);

  if (!parsedBatch.success && (!parsedSingle || !parsedSingle.success)) {
    return NextResponse.json(
      {
        error: parsedSingle?.error.flatten() ?? parsedBatch.error.flatten()
      },
      { status: 400 }
    );
  }

  let normalizedPayload: z.infer<typeof batchSchema>;

  if (parsedBatch.success) {
    normalizedPayload = parsedBatch.data;
  } else {
    if (!parsedSingle || !parsedSingle.success) {
      return NextResponse.json({ error: "Invalid enrichment payload" }, { status: 400 });
    }
    const single = parsedSingle.data;
    normalizedPayload = {
      locationId: single.locationId,
      locationName: single.locationName,
      restaurants: [single]
    };
  }

  const result = await importEnrichedRestaurants(normalizedPayload);
  return NextResponse.json(result);
}
