import { PageIntro } from "@/components/page-intro";
import { saveGoal } from "@/lib/actions";
import { getBootstrapData } from "@/lib/data";

export default async function GoalsPage() {
  const { goal } = await getBootstrapData();

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Goal"
        title="给饮食决策一个明确期限。"
        description="目标日期会直接影响系统的节制权重。目标越近，规则引擎越倾向于更稳的方案。"
      />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="glass-card rounded-[30px] p-6">
          <p className="eyebrow">Current Goal</p>
          <h3 className="mt-3 font-display text-4xl leading-none">{goal?.title ?? "还没有目标"}</h3>
          <div className="mt-5 grid gap-3">
            <div className="rounded-[22px] bg-white/60 p-4">
              <p className="text-sm text-[var(--color-ink-500)]">目标类型</p>
              <p className="mt-2 text-lg font-semibold">{goal?.goalType ?? "待设置"}</p>
            </div>
            <div className="rounded-[22px] bg-white/60 p-4">
              <p className="text-sm text-[var(--color-ink-500)]">目标日期</p>
              <p className="mt-2 text-lg font-semibold">
                {goal ? goal.targetDate.toLocaleDateString("zh-CN") : "待设置"}
              </p>
            </div>
            <div className="rounded-[22px] bg-white/60 p-4">
              <p className="text-sm text-[var(--color-ink-500)]">备注</p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-ink-700)]">{goal?.notes ?? "暂无"}</p>
            </div>
          </div>
        </article>

        <form action={saveGoal} className="glass-card grid gap-5 rounded-[30px] p-6 lg:grid-cols-2">
          <input type="hidden" name="id" defaultValue={goal?.id ?? ""} />
          <label className="field lg:col-span-2">
            <span className="field-label">目标标题</span>
            <input className="field-input" name="title" defaultValue={goal?.title ?? ""} required />
          </label>
          <label className="field">
            <span className="field-label">目标类型</span>
            <select className="field-select" name="goalType" defaultValue={goal?.goalType ?? "减脂"}>
              <option value="减脂">减脂</option>
              <option value="维持">维持</option>
              <option value="控糖">控糖</option>
              <option value="少水肿">少水肿</option>
              <option value="规律吃饭">规律吃饭</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">目标强度</span>
            <select className="field-select" name="intensity" defaultValue={goal?.intensity ?? "中等"}>
              <option value="保守">保守</option>
              <option value="中等">中等</option>
              <option value="激进">激进</option>
            </select>
          </label>
          <label className="field lg:col-span-2">
            <span className="field-label">目标日期</span>
            <input
              className="field-input"
              type="date"
              name="targetDate"
              defaultValue={goal ? goal.targetDate.toISOString().slice(0, 10) : ""}
              required
            />
          </label>
          <label className="field lg:col-span-2">
            <span className="field-label">备注</span>
            <textarea className="field-textarea min-h-28" name="notes" defaultValue={goal?.notes ?? ""} />
          </label>
          <div className="lg:col-span-2 flex justify-end">
            <button className="action-btn-primary" type="submit">
              保存目标
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
