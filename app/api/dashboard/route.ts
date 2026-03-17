import { NextResponse } from "next/server";

import { dayDiff, toDateKey } from "@/lib/date";
import { getDashboardSnapshot, requirePrimaryUser } from "@/lib/server-core";

export async function GET(request: Request) {
  const user = await requirePrimaryUser();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? toDateKey();
  const snapshot = await getDashboardSnapshot(user.id, date);

  return NextResponse.json({
    user: snapshot.user,
    goal: snapshot.goal,
    goalDaysLeft: dayDiff(snapshot.goal?.targetDate ?? null),
    recommendation: snapshot.recommendation,
    locationCount: snapshot.locations.length,
    restaurantCount: snapshot.restaurants.length,
    recentFeedbacks: snapshot.feedbacks
  });
}
