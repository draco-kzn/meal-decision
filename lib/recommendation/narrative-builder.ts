import type { RecommendationContext } from "@/lib/recommendation/types";
import type { StrategyType } from "@/types/domain";

function buildNarrativeLine(strategyType: StrategyType, toneStyle: string) {
  const styleMap: Record<StrategyType, Record<string, string>> = {
    STRICT: {
      教练型: "这段时间是关键窗口，今天稳住，后面会轻松很多。",
      温柔型: "离目标已经不远了，今天对自己克制一点，是在替未来省力。",
      玄学型: "今天先守住口腹之欲，整天的运势会更顺一些。",
      毒舌型: "离目标就差临门一脚，别被一顿饭带偏。"
    },
    BALANCED: {
      教练型: "不用绷太紧，稳定执行比偶尔爆发更值钱。",
      温柔型: "今天吃稳一点，就已经是在照顾自己了。",
      玄学型: "中庸路线是今天最适合你的节奏。",
      毒舌型: "别演极端主义，正常吃反而更像聪明人。"
    },
    RELAXED: {
      教练型: "允许一点缓冲，但别把放松写成失控。",
      温柔型: "今天可以松一点，重点是别让自己更累。",
      玄学型: "情绪不稳的日子，先安神，再谈节制。",
      毒舌型: "状态一般就别一边硬扛，一边乱吃。"
    },
    SOCIAL_COMP: {
      教练型: "晚上有局，中午先守住节奏。",
      温柔型: "给晚上的热闹留一点空间，中午吃稳就够了。",
      玄学型: "白天清一点，晚上的局才不会反噬你。",
      毒舌型: "知道晚上要放开，中午就别提前庆祝。"
    },
    RECOVERY: {
      教练型: "恢复状态也是执行的一部分，先把身体拉回正轨。",
      温柔型: "今天先照顾好胃和精神，恢复比逞强更重要。",
      玄学型: "气血不足的日子，热食会替你收尾。",
      毒舌型: "觉都没睡够，就别拿重口外卖继续补刀。"
    }
  };

  return styleMap[strategyType][toneStyle] ?? styleMap[strategyType]["温柔型"];
}

export function buildNarrative(
  context: RecommendationContext,
  strategyType: StrategyType,
  recommendedRestaurantName: string | null
) {
  const rationaleParts = [
    context.goal
      ? `距离目标日期还有 ${Math.max(
          Math.ceil((context.goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          0
        )} 天。`
      : "当前还没有设置目标日期。",
    `今天心情是“${context.dailyContext.mood}”，自律意愿为“${context.dailyContext.disciplineLevel}”。`,
    context.location ? `当前地点是 ${context.location.name}。` : "当前没有绑定地点。",
    recommendedRestaurantName ? `推荐餐厅是 ${recommendedRestaurantName}。` : "当前没有命中可推荐的餐厅。"
  ];

  return {
    rationale: rationaleParts.join(" "),
    narrativeLine: buildNarrativeLine(strategyType, context.user.toneStyle)
  };
}
