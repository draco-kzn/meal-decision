import { PageIntro } from "@/components/page-intro";
import { saveUserProfile } from "@/lib/actions";
import { getBootstrapData } from "@/lib/data";

export default async function ProfilePage() {
  const { user } = await getBootstrapData();

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Profile"
        title="先把档案建好。"
        description="推荐质量的上限，取决于这里的输入质量。饮食偏好、禁忌、预算和叙事风格都会直接影响建议内容。"
      />

      <form action={saveUserProfile} className="glass-card grid gap-5 rounded-[30px] p-6 lg:grid-cols-2 lg:p-8">
        <label className="field">
          <span className="field-label">昵称</span>
          <input className="field-input" name="nickname" defaultValue={user?.nickname ?? ""} required />
        </label>
        <label className="field">
          <span className="field-label">身高（cm）</span>
          <input className="field-input" type="number" name="heightCm" defaultValue={user?.heightCm ?? 170} required />
        </label>
        <label className="field">
          <span className="field-label">当前体重（kg）</span>
          <input className="field-input" step="0.1" type="number" name="weightKg" defaultValue={user?.weightKg ?? 60} required />
        </label>
        <label className="field">
          <span className="field-label">目标体重（kg，可选）</span>
          <input className="field-input" step="0.1" type="number" name="targetWeightKg" defaultValue={user?.targetWeightKg ?? ""} />
        </label>
        <label className="field lg:col-span-2">
          <span className="field-label">饮食偏好</span>
          <textarea className="field-textarea min-h-28" name="dietPreferences" defaultValue={user?.dietPreferences ?? ""} />
        </label>
        <label className="field lg:col-span-2">
          <span className="field-label">饮食禁忌 / 过敏</span>
          <textarea className="field-textarea min-h-24" name="restrictions" defaultValue={user?.restrictions ?? ""} />
        </label>
        <label className="field">
          <span className="field-label">预算等级</span>
          <select className="field-select" name="budgetLevel" defaultValue={user?.budgetLevel ?? "mid"}>
            <option value="low">低</option>
            <option value="mid">中</option>
            <option value="high">高</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">叙事风格</span>
          <select className="field-select" name="toneStyle" defaultValue={user?.toneStyle ?? "温柔型"}>
            <option value="教练型">教练型</option>
            <option value="温柔型">温柔型</option>
            <option value="玄学型">玄学型</option>
            <option value="毒舌型">毒舌型</option>
          </select>
        </label>
        <div className="lg:col-span-2 flex justify-end">
          <button className="action-btn-primary" type="submit">
            保存档案
          </button>
        </div>
      </form>
    </div>
  );
}
