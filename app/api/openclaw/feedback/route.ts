import { NextResponse } from "next/server";
import { z } from "zod";

import { pushFeedback } from "@/lib/openclaw";

const requestSchema = z.object({
  userId: z.string().min(1),
  payload: z.object({
    date: z.string().min(1),
    feedbackType: z.string().optional(),
    rawText: z.string().min(1),
    structuredPatch: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .optional()
  })
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        details: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const data = await pushFeedback(parsed.data.userId, parsed.data.payload);
  return NextResponse.json(data);
}
