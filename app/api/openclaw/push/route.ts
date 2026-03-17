import { NextResponse } from "next/server";
import { z } from "zod";

import { pushDailyRecommendation, receiveOpenClawPush } from "@/lib/openclaw";

const recommendationRequestSchema = z.object({
  userId: z.string().min(1),
  date: z.string().min(1),
  mealType: z.string().optional()
});

export async function POST(request: Request) {
  const payload = await request.json();

  const parsed = recommendationRequestSchema.safeParse(payload);
  if (parsed.success) {
    const result = await pushDailyRecommendation(parsed.data.userId, parsed.data.date, parsed.data.mealType);
    return NextResponse.json(result);
  }

  const result = await receiveOpenClawPush(payload);
  return NextResponse.json(result, { status: 202 });
}
