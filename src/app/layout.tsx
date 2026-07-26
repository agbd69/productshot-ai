import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "PortraitPro.ai | AI 职业头像与证件照",
  description: "上传自拍，生成领英职业头像、证件照、简历照和个人形象照。",
  keywords: ["AI头像", "领英职业头像", "证件照生成", "AI照片"],
  openGraph: {
    title: "PortraitPro.ai",
    description: "面向职业头像与证件照的 AI 照片生成工具。",
    siteName: "PortraitPro.ai",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html className="h-full antialiased" data-scroll-behavior="smooth" lang="zh-CN">
        <body className="min-h-full">
          <div className="noise-overlay" />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
