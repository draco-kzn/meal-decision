import { PageIntro } from "@/components/page-intro";
import { TodayRecommendationClient } from "@/components/today-recommendation-client";

export default function TodayPage() {
  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Today Recommendation"
        title="把 DailyContext 变成 recommendation 的真输入。"
        description="当前页面已经改成 API 驱动。你可以选择日期、餐次和地点，先保存 DailyContext，再触发 recommendation generation。"
      />

      <TodayRecommendationClient />
    </div>
  );
}
