import { NextResponse } from "next/server";
import { z } from "zod";

import { pullMemory } from "@/lib/openclaw";

const requestSchema = z.object({
  userId: z.string().min(1)
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

  const data = await pullMemory(parsed.data.userId);
  return NextResponse.json(data);
}
