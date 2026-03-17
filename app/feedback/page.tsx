import { PageIntro } from "@/components/page-intro";
import { saveFeedback } from "@/lib/actions";
import { getBootstrapData } from "@/lib/data";

export default async function FeedbackPage() {
  const { restaurants, feedbacks } = await getBootstrapData();

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Feedback"
        title="用轻量反馈闭环。"
        description="第一版不追求复杂追踪，重点是记录今天实际吃了什么、执行度如何，以及后续应该记住什么。"
      />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <form action={saveFeedback} className="glass-card grid gap-4 rounded-[30px] p-6">
          <label className="field">
            <span className="field-label">日期</span>
            <input className="field-input" type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </label>
          <label className="field">
            <span className="field-label">今天吃了哪家餐厅</span>
            <select className="field-select" name="restaurantId" defaultValue={restaurants[0]?.id}>
              <option value="">未记录具体餐厅</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">执行度</span>
            <select className="field-select" name="adherenceLevel" defaultValue="中">
              <option value="高">高</option>
              <option value="中">中</option>
              <option value="低">低</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">备注</span>
            <textarea className="field-textarea min-h-28" name="notes" />
          </label>
          <label className="field">
            <span className="field-label">图片 URL（占位字段）</span>
            <input className="field-input" name="imageUrl" />
          </label>
          <button className="action-btn-primary" type="submit">
            提交反馈
          </button>
        </form>

        <section className="grid gap-4">
          {feedbacks.map((feedback) => (
            <article key={feedback.id} className="glass-card rounded-[28px] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">{feedback.date.toLocaleDateString("zh-CN")}</p>
                  <h3 className="mt-2 text-xl font-semibold">
                    {feedback.restaurant?.name ?? "未绑定具体餐厅"}
                  </h3>
                </div>
                <span className="stat-pill">执行度 {feedback.adherenceLevel}</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--color-ink-700)]">{feedback.notes || "暂无备注"}</p>
              <p className="mt-4 text-xs text-[var(--color-ink-500)]">
                图片字段 {feedback.imageUrl ? `已填写：${feedback.imageUrl}` : "暂未填写"}
              </p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
