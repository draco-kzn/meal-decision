import type { DailyContext, Goal, Location, Restaurant, User } from "@prisma/client";

import type { RecommendationResult, StrategyType } from "@/types/domain";

type EngineInput = {
  user: User;
  goal: Goal | null;
  location: Location | null;
  restaurants: Restaurant[];
  todayContext: DailyContext;
  recentWeightTrendKg: number;
  mealType: string;
};

function daysUntil(date: Date) {
  const diff = date.getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function decideStrategyType(input: EngineInput): StrategyType {
  const daysLeft = input.goal ? daysUntil(input.goal.targetDate) : 30;
  const moodLow = /累|差|烦|低落/.test(input.todayContext.mood);
  const disciplineHigh = input.todayContext.disciplineLevel === "高";
  const socialTonight = /社交|聚餐|约会/.test(input.todayContext.socialPlan);
  const weightUp = input.recentWeightTrendKg > 0.4;
  const lateRecovery = (input.todayContext.sleepHours ?? 7) < 6;

  if (lateRecovery && moodLow) {
    return "RECOVERY";
  }

  if (socialTonight && input.mealType === "lunch") {
    return "SOCIAL_COMPENSATION";
  }

  if ((daysLeft <= 14 || weightUp) && disciplineHigh) {
    return "STRICT_CONTROL";
  }

  if (moodLow && !disciplineHigh) {
    return "RELAXED";
  }

  return "BALANCED";
}

function scoreRestaurant(restaurant: Restaurant, input: EngineInput, strategyType: StrategyType) {
  let score = restaurant.healthyScore * 0.55 + restaurant.satietyScore * 0.45;

  if (input.location?.name.includes("公司") && restaurant.walkMinutes <= 10) {
    score += 12;
  }

  if (strategyType === "STRICT_CONTROL") {
    score += restaurant.healthyScore * 0.3 - restaurant.avgPrice * 0.1;
  }

  if (strategyType === "BALANCED") {
    score += restaurant.healthyScore * 0.15 + restaurant.satietyScore * 0.15;
  }

  if (strategyType === "RELAXED") {
    score += restaurant.satietyScore * 0.3;
  }

  if (strategyType === "SOCIAL_COMPENSATION") {
    score += restaurant.healthyScore * 0.22;
  }

  if (strategyType === "RECOVERY") {
    score += /粥|汤|轻食/.test(restaurant.cuisine) ? 18 : 0;
  }

  if (restaurant.walkMinutes * 100 > (input.location?.walkRadiusM ?? 1000)) {
    score -= 18;
  }

  return score;
}

function buildOrder(restaurant: Restaurant, strategyType: StrategyType) {
  if (strategyType === "STRICT_CONTROL") {
    return `${restaurant.recommendedOrders}，主食减半，饮料改无糖。`;
  }

  if (strategyType === "RECOVERY") {
    return `${restaurant.recommendedOrders}，优先热食和温和口味。`;
  }

  if (strategyType === "RELAXED") {
    return `${restaurant.recommendedOrders}，允许保留一点满足感，但别再叠高风险小食。`;
  }

  return restaurant.recommendedOrders;
}

function buildFallback(restaurants: Restaurant[], chosenId: string | null) {
  const fallback = restaurants.find((restaurant) => restaurant.id !== chosenId) ?? restaurants[0];
  return fallback ? `${fallback.name}：${fallback.recommendedOrders}` : "先吃一份便利店高蛋白便当兜底";
}

function buildNarrativeLine(strategyType: StrategyType, user: User) {
  const tone = user.toneStyle;

  const styleMap: Record<StrategyType, Record<string, string>> = {
    STRICT_CONTROL: {
      教练型: "这几天是关键窗口，稳住今天，后面会轻松很多。",
      温柔型: "离目标已经很近了，今天对自己克制一点，是在帮未来的你省力。",
      玄学型: "今天的口腹之欲先按一按，运势会更顺。",
      毒舌型: "离目标只差临门一脚，别被一顿饭拖后腿。"
    },
    BALANCED: {
      教练型: "不用绷得太紧，稳定执行比偶尔爆发更值钱。",
      温柔型: "今天吃稳一点，就已经是在照顾自己了。",
      玄学型: "中庸是今天最旺你的路线。",
      毒舌型: "别演极端主义，正常吃反而更像聪明人。"
    },
    RELAXED: {
      教练型: "允许一点缓冲，但别把放松写成失控。",
      温柔型: "今天可以稍微松一点，重点是别让自己更累。",
      玄学型: "情绪波动大时，先安神，再谈节制。",
      毒舌型: "你今天状态一般，那就别一边硬扛一边乱吃。"
    },
    SOCIAL_COMPENSATION: {
      教练型: "晚上要社交，中午先把节奏守住。",
      温柔型: "给晚上的热闹留一点余地，中午吃稳就够了。",
      玄学型: "白天清一点，晚上的局才不会反噬你。",
      毒舌型: "知道晚上要放开，那中午就别先提前庆祝。"
    },
    RECOVERY: {
      教练型: "恢复状态也是执行的一部分，先把身体拉回正轨。",
      温柔型: "今天先照顾好胃和精神，恢复比逞强更重要。",
      玄学型: "气血不足的日子，热食会替你收尾。",
      毒舌型: "睡都没睡够，就别拿重口外卖继续补刀。"
    }
  };

  return styleMap[strategyType][tone] ?? styleMap[strategyType]["温柔型"];
}

export function generateRecommendation(input: EngineInput): RecommendationResult {
  const strategyType = decideStrategyType(input);
  const rankedRestaurants = [...input.restaurants].sort(
    (a, b) => scoreRestaurant(b, input, strategyType) - scoreRestaurant(a, input, strategyType)
  );
  const recommendedRestaurant = rankedRestaurants[0] ?? null;
  const restaurantName = recommendedRestaurant?.name ?? "便利店高蛋白便当";
  const recommendedOrder = recommendedRestaurant
    ? buildOrder(recommendedRestaurant, strategyType)
    : "选择一份高蛋白便当 + 无糖热饮，先保底。";
  const fallbackOption = buildFallback(rankedRestaurants, recommendedRestaurant?.id ?? null);
  const rationaleParts = [
    input.goal ? `距离目标日还有 ${Math.max(daysUntil(input.goal.targetDate), 0)} 天。` : "当前没有设定目标日。",
    `今天心情是“${input.todayContext.mood}”，自律意愿为“${input.todayContext.disciplineLevel}”。`,
    input.location ? `当前地点是 ${input.location.name}。` : "当前没有绑定地点。",
    strategyType === "STRICT_CONTROL"
      ? "因此今天更适合节制优先。"
      : strategyType === "SOCIAL_COMPENSATION"
        ? "今晚存在社交变量，所以这顿更偏向预留空间。"
        : strategyType === "RECOVERY"
          ? "状态恢复优先，吃温和、可控的内容更合理。"
          : "综合来看，今天走平衡路线最稳。"
  ];

  return {
    strategyType,
    restaurantId: recommendedRestaurant?.id ?? null,
    restaurantName,
    recommendedOrder,
    fallbackOption,
    rationale: rationaleParts.join(" "),
    narrativeLine: buildNarrativeLine(strategyType, input.user)
  };
}
