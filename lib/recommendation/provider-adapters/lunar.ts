import type { DailyContext } from "@prisma/client";

export async function getLunarSignal(dailyContext: DailyContext) {
  return {
    lunarTag: dailyContext.lunarTag ?? null,
    solarTermTag: dailyContext.solarTermTag ?? null
  };
}
