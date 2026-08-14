import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "超级大关昊",
  description: "关昊校园人物档案：二十二张照片、三段校园影像、六条名言、AI演绎传奇事件与可跳转的24级四班人物图鉴。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
