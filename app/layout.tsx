import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "超级大关昊",
  description: "关昊校园人物档案：照片、视频、人物事迹、AI演绎传奇事件，以及支持审核发布的校园投稿区。",
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
