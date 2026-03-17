import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";
import { MainNav } from "@/components/main-nav";

export const metadata: Metadata = {
  title: "今天吃什么呢？",
  description: "围绕目标日期的每日饮食与生活决策助手"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        <div className="app-shell min-h-screen">
          <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 py-4 lg:px-6 lg:py-6">
            <aside className="glass-card hidden w-72 flex-col rounded-[28px] p-5 lg:flex">
              <Link href="/" className="mb-8 block">
                <p className="eyebrow">Daily Decision OS</p>
                <h1 className="mt-3 font-display text-4xl leading-none">今天吃什么呢？</h1>
                <p className="mt-3 text-sm leading-6 text-[var(--color-ink-700)]">
                  一个围绕目标日期、地点和当日状态来做饮食决策的个人助理。
                </p>
              </Link>
              <MainNav />
              <div className="mt-auto rounded-[24px] bg-[rgba(25,18,13,0.92)] p-5 text-white">
                <p className="eyebrow text-[rgba(255,255,255,0.64)]">OpenClaw Ready</p>
                <p className="mt-3 text-lg">后续可接入记忆、网页补全和每日推送。</p>
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
              <header className="glass-card mb-4 flex items-center justify-between rounded-[24px] px-4 py-3 lg:hidden">
                <div>
                  <p className="eyebrow">Meal Assistant</p>
                  <p className="mt-1 font-display text-2xl">今天吃什么呢？</p>
                </div>
                <Link href="/today" className="action-btn-primary">
                  今日建议
                </Link>
              </header>
              <main className="flex-1">{children}</main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
