import { PageIntro } from "@/components/page-intro";
import { saveLocation } from "@/lib/actions";
import { getBootstrapData } from "@/lib/data";

export default async function LocationsPage() {
  const { locations } = await getBootstrapData();

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Locations"
        title="地点包决定可执行性。"
        description="同一家餐厅，在公司和在家附近的意义完全不同。地点包是推荐逻辑里最关键的约束之一。"
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="grid gap-4">
          {locations.map((location) => (
            <form key={location.id} action={saveLocation} className="glass-card grid gap-4 rounded-[28px] p-5 lg:grid-cols-2">
              <input type="hidden" name="id" defaultValue={location.id} />
              <label className="field">
                <span className="field-label">地点名称</span>
                <input className="field-input" name="name" defaultValue={location.name} required />
              </label>
              <label className="field">
                <span className="field-label">可接受步行距离（m）</span>
                <input className="field-input" type="number" name="walkRadiusM" defaultValue={location.walkRadiusM} required />
              </label>
              <label className="field lg:col-span-2">
                <span className="field-label">地址文本</span>
                <input className="field-input" name="addressText" defaultValue={location.addressText} required />
              </label>
              <label className="field">
                <span className="field-label">场景标签</span>
                <input className="field-input" name="sceneTags" defaultValue={location.sceneTags} required />
              </label>
              <label className="field">
                <span className="field-label">常出现时段</span>
                <input className="field-input" name="appearanceWindows" defaultValue={location.appearanceWindows} required />
              </label>
              <label className="field lg:col-span-2">
                <span className="field-label">备注</span>
                <textarea className="field-textarea min-h-24" name="notes" defaultValue={location.notes} />
              </label>
              <div className="lg:col-span-2 flex justify-end">
                <button className="action-btn-secondary" type="submit">
                  更新地点
                </button>
              </div>
            </form>
          ))}
        </section>

        <form action={saveLocation} className="glass-card grid gap-4 rounded-[30px] p-6">
          <p className="eyebrow">New Location</p>
          <h3 className="font-display text-3xl leading-none">新增地点</h3>
          <label className="field">
            <span className="field-label">地点名称</span>
            <input className="field-input" name="name" placeholder="例如：健身房 / 家 / 商圈" required />
          </label>
          <label className="field">
            <span className="field-label">地址文本</span>
            <input className="field-input" name="addressText" required />
          </label>
          <label className="field">
            <span className="field-label">场景标签</span>
            <input className="field-input" name="sceneTags" placeholder="例如：工作日午餐,加班,周末" required />
          </label>
          <label className="field">
            <span className="field-label">常出现时段</span>
            <input className="field-input" name="appearanceWindows" required />
          </label>
          <label className="field">
            <span className="field-label">可接受步行距离（m）</span>
            <input className="field-input" type="number" name="walkRadiusM" defaultValue={1000} required />
          </label>
          <label className="field">
            <span className="field-label">备注</span>
            <textarea className="field-textarea min-h-24" name="notes" />
          </label>
          <button className="action-btn-primary" type="submit">
            创建地点
          </button>
        </form>
      </div>
    </div>
  );
}
