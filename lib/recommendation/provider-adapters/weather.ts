import type { DailyContext } from "@prisma/client";

export async function getWeatherSignal(dailyContext: DailyContext) {
  return {
    weatherSummary: dailyContext.weatherSummary ?? null,
    weatherTempC: dailyContext.weatherTempC ?? null
  };
}
