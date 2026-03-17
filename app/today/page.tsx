import { PageIntro } from "@/components/page-intro";
import { generateTodayRecommendationAction } from "@/lib/actions";
import { getBootstrapData } from "@/lib/data";

export default async function TodayPage() {
  const { locations, todayContext, todayRecommendation } = await getBootstrapData();

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Today Recommendation"
        title="让系统基于今天的状态做决定。"
        description="这里的逻辑是规则引擎 + 文案层，后续可以无缝替换成 GPT-5.4 或 agent 调用。第一版先保证结构清晰、建议稳定。"
      />

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <form action={generateTodayRecommendationAction} className="glass-card grid gap-4 rounded-[30px] p-6">
          <label className="field">
            <span className="field-label">当前地点</span>
            <select className="field-select" name="currentLocationId" defaultValue={todayContext?.currentLocationId ?? locations[0]?.id}>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">mealType</span>
            <select className="field-select" name="mealType" defaultValue="lunch">
              <option value="breakfast">早餐</option>
              <option value="lunch">午餐</option>
              <option value="dinner">晚餐</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">今日心情</span>
            <input className="field-input" name="mood" defaultValue={todayContext?.mood ?? "一般偏累"} required />
          </label>
          <label className="field">
            <span className="field-label">今日自律意愿</span>
            <select className="field-select" name="disciplineLevel" defaultValue={todayContext?.disciplineLevel ?? "中"}>
              <option value="低">低</option>
              <option value="中">中</option>
              <option value="高">高</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">今日场景 / 社交计划</span>
            <input className="field-input" name="socialPlan" defaultValue={todayContext?.socialPlan ?? "今晚无社交"} required />
          </label>
          <label className="field">
            <span className="field-label">今日体重（可选）</span>
            <input className="field-input" type="number" step="0.1" name="weightToday" defaultValue={todayContext?.weightToday ?? ""} />
          </label>
          <label className="field">
            <span className="field-label">今日步数（可选）</span>
            <input className="field-input" type="number" name="stepsToday" defaultValue={todayContext?.stepsToday ?? ""} />
          </label>
          <label className="field">
            <span className="field-label">昨晚睡眠（小时，可选）</span>
            <input className="field-input" type="number" step="0.1" name="sleepHours" defaultValue={todayContext?.sleepHours ?? ""} />
          </label>
          <button className="action-btn-primary" type="submit">
            生成今日建议
          </button>
        </form>

        <article className="glass-card rounded-[30px] p-6 lg:p-8">
          <p className="eyebrow">Recommendation Result</p>
          <h3 className="mt-4 font-display text-4xl leading-none lg:text-5xl">
            {todayRecommendation?.restaurant?.name ?? "先生成建议"}
          </h3>
          <div className="mt-5 flex flex-wrap gap-3">
            <span className="stat-pill">策略 {todayRecommendation?.strategyType ?? "待生成"}</span>
            <span className="stat-pill">推荐点法 {todayRecommendation?.recommendedOrder ?? "待生成"}</span>
          </div>
          <div className="mt-6 grid gap-4">
            <section className="rounded-[24px] bg-white/60 p-5">
              <p className="text-sm text-[var(--color-ink-500)]">推荐点法</p>
              <p className="mt-2 text-base leading-7">{todayRecommendation?.recommendedOrder ?? "暂无"}</p>
            </section>
            <section className="rounded-[24px] bg-white/60 p-5">
              <p className="text-sm text-[var(--color-ink-500)]">备选方案</p>
              <p className="mt-2 text-base leading-7">{todayRecommendation?.fallbackOption ?? "暂无"}</p>
            </section>
            <section className="rounded-[24px] bg-[rgba(25,18,13,0.92)] p-5 text-white">
              <p className="text-sm text-white/60">一句叙事文案</p>
              <p className="mt-2 text-lg leading-8">{todayRecommendation?.narrativeLine ?? "今天先把状态告诉我。"}</p>
            </section>
            <section className="rounded-[24px] bg-white/60 p-5">
              <p className="text-sm text-[var(--color-ink-500)]">解释原因</p>
              <p className="mt-2 text-base leading-7 text-[var(--color-ink-700)]">
                {todayRecommendation?.rationale ?? "暂无解释。"}
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
