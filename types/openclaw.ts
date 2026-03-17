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
  restaurants: Array<{
    restaurantId: string;
    name: string;
    cuisine: string;
    avgPrice: string;
    walkTimeMin: number;
    hours: string;
    recommendedOrder: string[];
    riskTags: string[];
    source: string;
    updatedAt: string;
  }>;
};

export type OpenClawDailyRecommendationResponse = {
  userId: string;
  date: string;
  strategyType: string;
  restaurant: {
    restaurantId: string;
    name: string;
  } | null;
  recommendedOrder: string[];
  fallbackOption: Array<{
    restaurantId: string;
    name: string;
    recommendedOrder: string[];
  }>;
  rationale: string[];
  narrativeLine: string;
};

export type OpenClawFeedbackPayload = {
  date: string;
  feedbackType?: string;
  rawText: string;
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
