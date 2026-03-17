"use client";

import { useEffect, useState } from "react";

type DashboardResponse = {
  user: {
    nickname: string;
    toneStyle: string;
  } | null;
  goal: {
    title: string;
  } | null;
  goalDaysLeft: number | null;
  recommendation: {
    strategyType: string;
    recommendedOrder: string;
    rationale: string;
    narrativeLine: string;
    confidence?: string;
    sourceType?: string;
    restaurant: {
      name: string;
    } | null;
  } | null;
  locationCount: number;
  restaurantCount: number;
  recentFeedbacks: Array<unknown>;
};

export function DashboardClient() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/dashboard", { signal: controller.signal, cache: "no-store" })
      .then((response) => response.json())
      .then((json) => setData(json))
      .catch((requestError: Error) => {
        if (requestError.name !== "AbortError") {
          setError("Dashboard 数据加载失败");
        }
      });

    return () => controller.abort();
  }, []);

  if (error) {
    return <div className="glass-card rounded-[30px] p-6 text-sm text-red-700">{error}</div>;
  }

  if (!data) {
    return <div className="glass-card rounded-[30px] p-6 text-sm text-[var(--color-ink-700)]">正在加载 Dashboard 数据…</div>;
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
      <article className="glass-card rounded-[30px] p-6 lg:p-8">
        <p className="eyebrow">Today&apos;s Call</p>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <h3 className="font-display text-4xl leading-none lg:text-5xl">
              {data.recommendation?.restaurant?.name ?? "今天还没有生成建议"}
            </h3>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-ink-700)]">
              {data.recommendation?.rationale ?? "先去“今日建议”页保存 DailyContext，再触发 recommendation 生成。"}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="stat-pill">策略 {data.recommendation?.strategyType ?? "待生成"}</span>
              <span className="stat-pill">推荐点法 {data.recommendation?.recommendedOrder ?? "待生成"}</span>
              {data.recommendation?.confidence ? (
                <span className="stat-pill">置信度 {data.recommendation.confidence}</span>
              ) : null}
              {data.recommendation?.sourceType ? (
                <span className="stat-pill">来源 {data.recommendation.sourceType}</span>
              ) : null}
            </div>
            <p className="mt-6 rounded-[22px] bg-[rgba(25,18,13,0.92)] px-5 py-4 text-sm leading-7 text-white">
              {data.recommendation?.narrativeLine ?? "当前系统已经切到 API 驱动，下一步是写入今天的建议结果。"}
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[22px] border border-[rgba(83,70,56,0.1)] bg-white/60 p-4">
              <p className="text-sm text-[var(--color-ink-500)]">当前目标</p>
              <p className="mt-2 text-xl font-semibold">{data.goal?.title ?? "尚未设置"}</p>
            </div>
            <div className="rounded-[22px] border border-[rgba(83,70,56,0.1)] bg-white/60 p-4">
              <p className="text-sm text-[var(--color-ink-500)]">距离目标日期</p>
              <p className="mt-2 text-xl font-semibold">
                {data.goalDaysLeft !== null ? `${data.goalDaysLeft} 天` : "待设置"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[rgba(83,70,56,0.1)] bg-white/60 p-4">
              <p className="text-sm text-[var(--color-ink-500)]">用户档案</p>
              <p className="mt-2 text-xl font-semibold">{data.user?.nickname ?? "未建档"}</p>
            </div>
          </div>
        </div>
      </article>

      <div className="grid gap-4">
        <article className="glass-card rounded-[30px] p-6">
          <p className="eyebrow">Snapshot</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[22px] bg-white/60 p-4">
              <p className="text-sm text-[var(--color-ink-500)]">地点数</p>
              <p className="mt-2 text-2xl font-semibold">{data.locationCount}</p>
            </div>
            <div className="rounded-[22px] bg-white/60 p-4">
              <p className="text-sm text-[var(--color-ink-500)]">餐厅数</p>
              <p className="mt-2 text-2xl font-semibold">{data.restaurantCount}</p>
            </div>
            <div className="rounded-[22px] bg-white/60 p-4">
              <p className="text-sm text-[var(--color-ink-500)]">最近反馈</p>
              <p className="mt-2 text-2xl font-semibold">{data.recentFeedbacks.length}</p>
            </div>
            <div className="rounded-[22px] bg-white/60 p-4">
              <p className="text-sm text-[var(--color-ink-500)]">叙事风格</p>
              <p className="mt-2 text-lg font-semibold">{data.user?.toneStyle ?? "未设置"}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
