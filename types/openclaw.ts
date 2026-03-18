export type OpenClawMemoryResponse = {
  userId: string;
  profile: {
    dietPreferences: string[];
    dietRestrictions: string[];
    budgetPreference: string;
    tonePreference: string;
  };
  goals: Array<{
    title: string;
    type: string;
    targetDate: string;
    intensity: string;
  }>;
  locations: Array<{
    locationId: string;
    name: string;
    walkRadiusMin: number;
    specialRules: string[];
    coverageStatus: "empty" | "partial" | "rich";
  }>;
  recentContext: {
    recentRestaurants: string[];
    recentFeedback: string[];
    bodyTrend: {
      weight: string;
      steps: string;
      sleep: string;
    };
  };
};

export type OpenClawLocationEnrichmentResponse = {
  locationId: string;
  locationName: string;
  coverageStatus?: "empty" | "partial" | "rich";
  suggestedNextStep?: string;
  restaurants: Array<{
    restaurantId: string;
    name: string;
    cuisine: string;
    avgPrice: string;
    walkTimeMin: number;
    hours: string;
    recommendedOrder: string[];
    avoidOrders: string[];
    riskTags: string[];
    notes: string;
    source: string;
    updatedAt: string;
    enrichmentConfidence: string;
  }>;
};

export type OpenClawDailyRecommendationResponse = {
  userId: string;
  date: string;
  mealType: string;
  strategyType: string;
  locationId: string | null;
  locationName: string | null;
  restaurant: {
    restaurantId: string;
    name: string;
  } | null;
  recommendedOrder: string[];
  fallbackOption: Array<{
    restaurantId?: string;
    restaurantName: string;
    recommendedOrder: string[];
  }>;
  rationale: string[];
  narrativeLine: string;
  sourceType: "OPENCLAW" | "RULE_ENGINE" | "HYBRID";
  confidence: "low" | "medium" | "high";
};

export type OpenClawFeedbackPayload = {
  date: string;
  feedbackType?: string;
  rawText: string;
  currentLocationId?: string | null;
  restaurantId?: string | null;
  structuredPatch?: Record<string, string | number | boolean | null>;
};

export type OpenClawFeedbackResponse = {
  userId: string;
  date: string;
  accepted: boolean;
  feedbackType: string;
  storedPatch: Record<string, string | number | boolean | null>;
  summary: string;
};
