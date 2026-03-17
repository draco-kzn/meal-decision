import Link from "next/link";

import { PageIntro } from "@/components/page-intro";
import { DashboardClient } from "@/components/dashboard-client";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Dashboard"
        title="围绕目标日期来决定今天怎么吃。"
        description="第二阶段开始，这个首页不再直接依赖 seed 直出，而是通过 API 读取 profile、goal、recommendation 和 snapshot 数据。"
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

      <DashboardClient />
    </div>
  );
}
