import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "灵感库 - AI 提示词",
  description: "飞书多维表格驱动的 AI 提示词灵感库",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
