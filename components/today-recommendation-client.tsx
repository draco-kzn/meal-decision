"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { toDateKey } from "@/lib/date";

type LocationItem = {
  id: string;
  name: string;
  coverageStatus?: string;
};

type DailyContextResponse = {
  currentLocationId: string | null;
  mood: string;
  disciplineLevel: string;
  socialPlan: string;
  weightToday: number | null;
  stepsToday: number | null;
  sleepHours: number | null;
  weatherSummary: string | null;
  weatherTempC: number | null;
  lunarTag: string | null;
  solarTermTag: string | null;
  astroTag: string | null;
  notes: string;
} | null;

type RecommendationResponse = {
  strategyType: string;
  recommendedOrder: string;
  fallbackOption: string;
  rationale: string;
  narrativeLine: string;
  confidence?: string;
  sourceType?: string;
  restaurant: {
    name: string;
    location?: {
      name: string;
    } | null;
  } | null;
} | null;

const DEFAULT_CONTEXT: NonNullable<DailyContextResponse> = {
  currentLocationId: null,
  mood: "steady",
  disciplineLevel: "medium",
  socialPlan: "none",
  weightToday: null,
  stepsToday: null,
  sleepHours: null,
  weatherSummary: null,
  weatherTempC: null,
  lunarTag: null,
  solarTermTag: null,
  astroTag: null,
  notes: ""
};

export function TodayRecommendationClient() {
  const [date, setDate] = useState(toDateKey());
  const [mealType, setMealType] = useState("lunch");
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [context, setContext] = useState<DailyContextResponse>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const locationOptions = useMemo(() => locations, [locations]);

  useEffect(() => {
    fetch("/api/locations", { cache: "no-store" })
      .then((response) => response.json())
      .then((json) => setLocations(json));
  }, []);

  useEffect(() => {
    const encodedDate = encodeURIComponent(date);
    fetch(`/api/daily-context?date=${encodedDate}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((json) => setContext(json));

    fetch(`/api/recommendations?date=${encodedDate}&mealType=${mealType}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((json) => setRecommendation(json));
  }, [date, mealType]);

  async function saveContext() {
    const current = {
      ...DEFAULT_CONTEXT,
      ...context,
      currentLocationId: context?.currentLocationId ?? locationOptions[0]?.id ?? null
    };

    const response = await fetch("/api/daily-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        ...current
      })
    });

    return response.json();
  }

  function updateContext(field: string, value: string | number | null) {
    setContext((current) => ({
      ...DEFAULT_CONTEXT,
      ...current,
      currentLocationId: current?.currentLocationId ?? locationOptions[0]?.id ?? null,
      [field]: value
    }));
  }

  function handleSaveContext() {
    startTransition(async () => {
      const saved = await saveContext();
      setContext(saved);
      setMessage("DailyContext 已保存");
    });
  }

  function handleGenerate() {
    startTransition(async () => {
      await saveContext();
      const response = await fetch("/api/recommendations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, mealType })
      });
      const generated = await response.json();
      setRecommendation(generated);
      setMessage("今日建议已重新生成");
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="glass-card grid gap-4 rounded-[30px] p-6">
        <label className="field">
          <span className="field-label">日期</span>
          <input className="field-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">餐次</span>
          <select className="field-select" value={mealType} onChange={(event) => setMealType(event.target.value)}>
            <option value="breakfast">早餐</option>
            <option value="lunch">午餐</option>
            <option value="dinner">晚餐</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">当前位置</span>
          <select
            className="field-select"
            value={context?.currentLocationId ?? locationOptions[0]?.id ?? ""}
            onChange={(event) => updateContext("currentLocationId", event.target.value)}
          >
            {locationOptions.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
                {location.coverageStatus ? ` (${location.coverageStatus})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">今日心情</span>
          <input
            className="field-input"
            value={context?.mood ?? ""}
            onChange={(event) => updateContext("mood", event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">今日自律意愿</span>
          <select
            className="field-select"
            value={context?.disciplineLevel ?? "medium"}
            onChange={(event) => updateContext("disciplineLevel", event.target.value)}
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">今日社交计划</span>
          <input
            className="field-input"
            value={context?.socialPlan ?? ""}
            onChange={(event) => updateContext("socialPlan", event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">体重（可选）</span>
          <input
            className="field-input"
            type="number"
            step="0.1"
            value={context?.weightToday ?? ""}
            onChange={(event) =>
              updateContext("weightToday", event.target.value ? Number(event.target.value) : null)
            }
          />
        </label>
        <label className="field">
          <span className="field-label">步数（可选）</span>
          <input
            className="field-input"
            type="number"
            value={context?.stepsToday ?? ""}
            onChange={(event) =>
              updateContext("stepsToday", event.target.value ? Number(event.target.value) : null)
            }
          />
        </label>
        <label className="field">
          <span className="field-label">睡眠（小时，可选）</span>
          <input
            className="field-input"
            type="number"
            step="0.1"
            value={context?.sleepHours ?? ""}
            onChange={(event) =>
              updateContext("sleepHours", event.target.value ? Number(event.target.value) : null)
            }
          />
        </label>
        <label className="field">
          <span className="field-label">天气摘要</span>
          <input
            className="field-input"
            value={context?.weatherSummary ?? ""}
            onChange={(event) => updateContext("weatherSummary", event.target.value || null)}
          />
        </label>
        <label className="field">
          <span className="field-label">备注</span>
          <textarea
            className="field-textarea min-h-24"
            value={context?.notes ?? ""}
            onChange={(event) => updateContext("notes", event.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button className="action-btn-secondary" type="button" onClick={handleSaveContext} disabled={isPending}>
            保存 DailyContext
          </button>
          <button className="action-btn-primary" type="button" onClick={handleGenerate} disabled={isPending}>
            生成今日建议
          </button>
        </div>
        {message ? <p className="text-sm text-[var(--color-ink-700)]">{message}</p> : null}
      </section>

      <article className="glass-card rounded-[30px] p-6 lg:p-8">
        <p className="eyebrow">Recommendation Result</p>
        <h3 className="mt-4 font-display text-4xl leading-none lg:text-5xl">
          {recommendation?.restaurant?.name ?? "先生成建议"}
        </h3>
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="stat-pill">策略 {recommendation?.strategyType ?? "待生成"}</span>
          {recommendation?.confidence ? <span className="stat-pill">置信度 {recommendation.confidence}</span> : null}
          {recommendation?.sourceType ? <span className="stat-pill">来源 {recommendation.sourceType}</span> : null}
        </div>
        <div className="mt-6 grid gap-4">
          <section className="rounded-[24px] bg-white/60 p-5">
            <p className="text-sm text-[var(--color-ink-500)]">推荐点法</p>
            <p className="mt-2 text-base leading-7">{recommendation?.recommendedOrder ?? "暂无"}</p>
          </section>
          <section className="rounded-[24px] bg-white/60 p-5">
            <p className="text-sm text-[var(--color-ink-500)]">备选方案</p>
            <p className="mt-2 text-base leading-7">{recommendation?.fallbackOption ?? "暂无"}</p>
          </section>
          <section className="rounded-[24px] bg-[rgba(25,18,13,0.92)] p-5 text-white">
            <p className="text-sm text-white/60">一句叙事文案</p>
            <p className="mt-2 text-lg leading-8">{recommendation?.narrativeLine ?? "还没有文案。"}</p>
          </section>
          <section className="rounded-[24px] bg-white/60 p-5">
            <p className="text-sm text-[var(--color-ink-500)]">解释原因</p>
            <p className="mt-2 text-base leading-7 text-[var(--color-ink-700)]">
              {recommendation?.rationale ?? "暂无解释。"}
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
