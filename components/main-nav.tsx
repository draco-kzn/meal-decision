"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", detail: "今日建议和总览" },
  { href: "/profile", label: "建档", detail: "用户基础信息" },
  { href: "/goals", label: "目标", detail: "目标日期与强度" },
  { href: "/locations", label: "地点包", detail: "常驻地点与场景" },
  { href: "/restaurants", label: "餐厅库", detail: "按地点维护知识库" },
  { href: "/today", label: "今日建议", detail: "规则引擎生成推荐" },
  { href: "/feedback", label: "反馈", detail: "执行度与复盘" }
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "block rounded-[22px] border px-4 py-3 transition",
              active
                ? "border-[rgba(200,91,53,0.25)] bg-[rgba(200,91,53,0.12)]"
                : "border-transparent bg-transparent hover:border-[rgba(83,70,56,0.08)] hover:bg-white/45"
            ].join(" ")}
          >
            <p className="text-base font-semibold text-[var(--color-ink-900)]">{item.label}</p>
            <p className="mt-1 text-sm text-[var(--color-ink-700)]">{item.detail}</p>
          </Link>
        );
      })}
    </nav>
  );
}
