import type { DailyContext } from "@prisma/client";

export async function getAstroSignal(dailyContext: DailyContext) {
  return {
    astroTag: dailyContext.astroTag ?? null
  };
}
