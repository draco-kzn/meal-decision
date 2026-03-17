import type { Restaurant } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type LocationCoverageStatus = "empty" | "partial" | "rich";

type CoverageAssessment = {
  coverageStatus: LocationCoverageStatus;
  suggestedNextStep: string;
};

function restaurantSupportsRecovery(restaurant: Restaurant) {
  return /salad|healthy|soup|congee|light|轻食|沙拉|汤|粥/i.test(
    `${restaurant.cuisine} ${restaurant.recommendedOrders} ${restaurant.notes}`
  );
}

function getStrategyVariety(restaurants: Restaurant[]) {
  const buckets = new Set<string>();

  if (restaurants.some((restaurant) => restaurant.healthyScore >= 80)) {
    buckets.add("strict");
  }

  if (restaurants.some((restaurant) => restaurant.healthyScore >= 65 && restaurant.satietyScore >= 65)) {
    buckets.add("balanced");
  }

  if (restaurants.some((restaurant) => restaurant.satietyScore >= 80)) {
    buckets.add("relaxed");
  }

  if (restaurants.some(restaurantSupportsRecovery)) {
    buckets.add("recovery");
  }

  return buckets.size;
}

export function assessLocationCoverage(restaurants: Restaurant[]): CoverageAssessment {
  if (restaurants.length === 0) {
    return {
      coverageStatus: "empty",
      suggestedNextStep: "Ask the user to add 2-3 real restaurants for this location first."
    };
  }

  if (restaurants.length <= 3) {
    return {
      coverageStatus: "partial",
      suggestedNextStep: "Continue enriching known restaurants or ask the user to add 1-2 more real options."
    };
  }

  if (getStrategyVariety(restaurants) >= 2) {
    return {
      coverageStatus: "rich",
      suggestedNextStep: "Coverage is already usable for daily recommendations. Keep enrichment data fresh."
    };
  }

  return {
    coverageStatus: "partial",
    suggestedNextStep: "Add more variety so this location can support at least two recommendation strategies."
  };
}

export async function syncLocationCoverageStatus(locationId: string) {
  const restaurants = await prisma.restaurant.findMany({
    where: { locationId },
    orderBy: { createdAt: "asc" }
  });

  const assessment = assessLocationCoverage(restaurants);

  await prisma.location.update({
    where: { id: locationId },
    data: { coverageStatus: assessment.coverageStatus }
  });

  return assessment;
}
