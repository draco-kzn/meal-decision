import { NextResponse } from "next/server";
import { z } from "zod";

import { importStructuredFeedback } from "@/lib/recommendation/provider-adapters/openclaw";

const schema = z.object({
  userId: z.string().min(1),
  date: z.string().min(1),
  restaurantId: z.string().nullable().optional(),
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
