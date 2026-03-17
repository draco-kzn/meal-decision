import { NextResponse } from "next/server";
import { z } from "zod";

import { enrichLocation } from "@/lib/openclaw";

const requestSchema = z.object({
  locationId: z.string().min(1)
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

  const data = await enrichLocation(parsed.data.locationId);
  return NextResponse.json(data);
}
