import Link from "next/link";

import { PageIntro } from "@/components/page-intro";
import { getBootstrapData } from "@/lib/data";

function dayDiff(targetDate: Date | null) {
  if (!targetDate) return null;
  const diff = targetDate.getTime() - new Date().getTime();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

export default async function DashboardPage() {
  const { user, goal, locations, restaurants, todayRecommendation, feedbacks } = await getBootstrapData();
  const daysLeft = dayDiff(goal?.targetDate ?? null);

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Dashboard"
        title="围绕目标日期来决定今天怎么吃。"
        description="这不是随机选餐器，而是一个带目标感的个人助理。它结合你的目标日、地点、当天状态和餐厅知识库，给出今天更合适的决策。"
        actions={
          <>
            <Link href="/today" className="action-btn-primary">
              去生成今日建议
            </Link>
            <Link href="/restaurants" className="action-btn-secondary">
              维护餐厅库
            </Link>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="glass-card rounded-[30px] p-6 lg:p-8">
          <p className="eyebrow">Today&apos;s Call</p>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <h3 className="font-display text-4xl leading-none lg:text-5xl">
                {todayRecommendation?.restaurant?.name ?? todayRecommendation?.recommendedOrder ?? "先去生成今天的建议"}
              </h3>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-ink-700)]">
                {todayRecommendation?.rationale ??
                  "还没有今日建议。录入当下状态后，系统会给出策略类型、推荐餐厅、点法和备选方案。"}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="stat-pill">
                  策略类型 {todayRecommendation?.strategyType ?? "待生成"}
                </span>
                <span className="stat-pill">推荐点法 {todayRecommendation?.recommendedOrder ?? "待生成"}</span>
              </div>
              <p className="mt-6 rounded-[22px] bg-[rgba(25,18,13,0.92)] px-5 py-4 text-sm leading-7 text-white">
                {todayRecommendation?.narrativeLine ??
                  "今天先把基础信息补齐，然后让规则引擎给你一个明确答案。"}
              </p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-[22px] border border-[rgba(83,70,56,0.1)] bg-white/60 p-4">
                <p className="text-sm text-[var(--color-ink-500)]">当前目标</p>
                <p className="mt-2 text-xl font-semibold">{goal?.title ?? "尚未设置"}</p>
              </div>
              <div className="rounded-[22px] border border-[rgba(83,70,56,0.1)] bg-white/60 p-4">
                <p className="text-sm text-[var(--color-ink-500)]">距离目标日期</p>
                <p className="mt-2 text-xl font-semibold">{daysLeft !== null ? `${daysLeft} 天` : "待设置"}</p>
              </div>
              <div className="rounded-[22px] border border-[rgba(83,70,56,0.1)] bg-white/60 p-4">
                <p className="text-sm text-[var(--color-ink-500)]">用户档案</p>
                <p className="mt-2 text-xl font-semibold">{user?.nickname ?? "未建档"}</p>
              </div>
            </div>
          </div>
        </article>

        <div className="grid gap-4">
          <article className="glass-card rounded-[30px] p-6">
            <p className="eyebrow">Quick Links</p>
            <div className="mt-4 grid gap-3">
              {[
                { href: "/profile", label: "建档", text: "更新基础信息和叙事风格" },
                { href: "/locations", label: "地点包", text: "管理常驻地点和场景" },
                { href: "/restaurants", label: "餐厅库", text: "维护地点对应的餐厅知识库" },
                { href: "/feedback", label: "反馈", text: "记录执行度和复盘信息" }
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[22px] border border-[rgba(83,70,56,0.08)] bg-white/60 px-4 py-4 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  <p className="text-base font-semibold">{item.label}</p>
                  <p className="mt-1 text-sm text-[var(--color-ink-700)]">{item.text}</p>
                </Link>
              ))}
            </div>
          </article>

          <article className="glass-card rounded-[30px] p-6">
            <p className="eyebrow">Snapshot</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[22px] bg-white/60 p-4">
                <p className="text-sm text-[var(--color-ink-500)]">地点数</p>
                <p className="mt-2 text-2xl font-semibold">{locations.length}</p>
              </div>
              <div className="rounded-[22px] bg-white/60 p-4">
                <p className="text-sm text-[var(--color-ink-500)]">餐厅数</p>
                <p className="mt-2 text-2xl font-semibold">{restaurants.length}</p>
              </div>
              <div className="rounded-[22px] bg-white/60 p-4">
                <p className="text-sm text-[var(--color-ink-500)]">最近反馈</p>
                <p className="mt-2 text-2xl font-semibold">{feedbacks.length}</p>
              </div>
              <div className="rounded-[22px] bg-white/60 p-4">
                <p className="text-sm text-[var(--color-ink-500)]">叙事风格</p>
                <p className="mt-2 text-lg font-semibold">{user?.toneStyle ?? "未设置"}</p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
