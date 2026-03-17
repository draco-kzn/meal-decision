import { NextResponse } from "next/server";

import { getCurrentGoal, getPrimaryUser } from "@/lib/server-core";

export async function GET() {
  const user = await getPrimaryUser();
  if (!user) {
    return NextResponse.json(null);
  }

  const goal = await getCurrentGoal(user.id);
  return NextResponse.json(goal);
}
