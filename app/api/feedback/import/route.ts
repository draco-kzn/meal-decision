import { NextResponse } from "next/server";
import { z } from "zod";

import { importStructuredFeedback } from "@/lib/recommendation/provider-adapters/openclaw";

const schema = z.object({
  userId: z.string().optional(),
  date: z.string().min(1),
  feedbackType: z.string().default("direct_feedback"),
  rawText: z.string().optional(),
  currentLocationId: z.string().nullable().optional(),
  structuredPatch: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
  restaurantId: z.string().nullable().optional(),
  restaurantName: z.string().nullable().optional(),
  adherenceLevel: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().nullable().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await importStructuredFeedback(parsed.data);
  return NextResponse.json(result);
}
