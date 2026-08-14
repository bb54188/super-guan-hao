import type { Metadata } from "next";
import { PersonProfile, type PersonProfileData } from "../person-profile";

export const metadata: Metadata = {
  title: "尹浩哲人物档案｜超级大关昊",
  description: "尹浩哲（奶龙）的人物档案与4K值日视频。",
};

const profile: PersonProfileData = {
  name: "尹浩哲",
  romanName: "YIN HAOZHE",
  index: "03",
  alias: "奶龙",
  role: "校园对决选手一号",
  intro: "经常与关昊展开日常切磋的选手之一；值日时刻也有一份单独的动态记录。",
  portrait: "/guan-hao/cast-nailong.webp",
  portraitAlt: "尹浩哲的头像照片",
  theme: "nailong",
  tags: ["奶龙", "值日记录", "对决选手"],
  media: {
    kind: "video",
    sources: [
      {
        src: "/guan-hao/yinhaozhe-duty-2026-07-11.mp4",
        label: "4K 原画",
        width: 3840,
        height: 2160,
      },
      {
        src: "/guan-hao/yinhaozhe-duty-2026-07-11-1080p.mp4",
        label: "1080P 高清",
        width: 1920,
        height: 1080,
      },
      {
        src: "/guan-hao/yinhaozhe-duty-2026-07-11-720p.mp4",
        label: "720P 流畅",
        width: 1280,
        height: 720,
      },
    ],
    poster: "/guan-hao/yinhaozhe-duty-2026-07-11-poster.webp",
    eyebrow: "DUTY LOG · 4K 60FPS",
    title: "尹浩哲值日记录",
    note: "宿舍里的值日现场。保持原始4K分辨率与60帧，采用H.264 + AAC网页编码。",
    specs: [
      { value: "3840 × 2160", label: "原始分辨率" },
      { value: "60 FPS", label: "原始帧率" },
      { value: "H.264 + AAC", label: "浏览器兼容" },
    ],
  },
};

export default function YinHaozhePage() {
  return <PersonProfile profile={profile} />;
}
