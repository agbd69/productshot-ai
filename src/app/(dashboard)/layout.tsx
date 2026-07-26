import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { ReactNode } from "react";

import { isClerkConfigured } from "@/lib/auth-config";

const nav = [
  ["工作台", "/dashboard"],
  ["生成照片", "/create"],
  ["历史记录", "/generations"],
  ["购买额度", "/billing"],
  ["设置", "/settings"],
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  if (isClerkConfigured() || process.env.NODE_ENV === "production") {
    await auth.protect();
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-r border-white/10 bg-slate-950/70 p-4">
        <Link className="block text-lg font-semibold text-white" href="/">PortraitPro.ai</Link>
        <nav className="mt-8 flex gap-2 overflow-x-auto lg:block lg:space-y-1">
          {nav.map(([label, href]) => (
            <Link className="block rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white" href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
