import type { Metadata } from "next";
import { PersonProfile, type PersonProfileData } from "../person-profile";

export const metadata: Metadata = {
  title: "赵俊杰人物档案｜超级大关昊",
  description: "赵俊杰（BG、鸡摸、金八）的人物档案、个人照片集与三段4K动态影像。",
};

const profile: PersonProfileData = {
  name: "赵俊杰",
  romanName: "ZHAO JUNJIE",
  index: "04",
  alias: "BG / 鸡摸 / 金八",
  role: "多重代号持有者",
  intro: "与关昊高频交锋的另一位选手，多个代号随时切换，日常状态也被单独收录。",
  portrait: "/guan-hao/cast-bg.webp",
  portraitAlt: "赵俊杰的头像照片",
  theme: "bg",
  tags: ["BG", "鸡摸", "金八"],
  media: {
    kind: "video",
    sources: [
      {
        src: "/guan-hao/zhaojunjie-gaming-2026-07-24.mp4",
        label: "4K 原画",
        width: 3840,
        height: 2160,
      },
      {
        src: "/guan-hao/zhaojunjie-gaming-2026-07-24-1080p.mp4",
        label: "1080P 高清",
        width: 1920,
        height: 1080,
      },
      {
        src: "/guan-hao/zhaojunjie-gaming-2026-07-24-720p.mp4",
        label: "720P 流畅",
        width: 1280,
        height: 720,
      },
    ],
    poster: "/guan-hao/zhaojunjie-gaming-2026-07-24-poster.webp",
    eyebrow: "DORM LOG · 2026.07.24",
    title: "赵俊杰游戏进行时",
    note: "宿舍里的游戏时刻。保留原始4K分辨率与59.94帧，仅做自然校色，并转换为H.264 + AAC网页兼容版本。",
    specs: [
      { value: "4K", label: "3840 × 2160" },
      { value: "59.94", label: "FPS" },
      { value: "NATURAL", label: "自然校色" },
    ],
  },
  videoArchiveNote: "两段 2026 年 7 月 9 日的校园记录，均由 D-Log 原片完成自然调色，并保留原始 4K 分辨率与 59.94 FPS。",
  videos: [
    {
      sources: [
        {
          src: "/guan-hao/zhaojunjie-on-bed-2026-07-09.mp4",
          label: "4K 原画",
          width: 3840,
          height: 2160,
        },
        {
          src: "/guan-hao/zhaojunjie-on-bed-2026-07-09-1080p.mp4",
          label: "1080P 高清",
          width: 1920,
          height: 1080,
        },
        {
          src: "/guan-hao/zhaojunjie-on-bed-2026-07-09-720p.mp4",
          label: "720P 流畅",
          width: 1280,
          height: 720,
        },
      ],
      poster: "/guan-hao/zhaojunjie-on-bed-2026-07-09-poster.webp",
      eyebrow: "DORM LOG · 2026.07.09",
      title: "床上的赵俊杰",
      note: "宿舍床铺上的一段即时记录。D-Log 原片已完成对比度、白平衡与色彩还原，并转为 H.264 + AAC 网页兼容版本。",
      specs: [
        { value: "4K", label: "3840 × 2160" },
        { value: "59.94", label: "FPS" },
        { value: "D-LOG", label: "自然调色" },
      ],
    },
    {
      sources: [
        {
          src: "/guan-hao/chuhaixu-chases-zhaojunjie-2026-07-09.mp4",
          label: "4K 原画",
          width: 3840,
          height: 2160,
        },
        {
          src: "/guan-hao/chuhaixu-chases-zhaojunjie-2026-07-09-1080p.mp4",
          label: "1080P 高清",
          width: 1920,
          height: 1080,
        },
        {
          src: "/guan-hao/chuhaixu-chases-zhaojunjie-2026-07-09-720p.mp4",
          label: "720P 流畅",
          width: 1280,
          height: 720,
        },
      ],
      poster: "/guan-hao/chuhaixu-chases-zhaojunjie-2026-07-09-poster.webp",
      eyebrow: "NIGHT CHASE · 2026.07.09",
      title: "褚海旭追赵俊杰",
      note: "夜间校园的一次追逐记录。保留现场光线与运动感，同时从 D-Log 恢复自然层次和色彩。",
      specs: [
        { value: "4K", label: "3840 × 2160" },
        { value: "59.94", label: "FPS" },
        { value: "D-LOG", label: "自然调色" },
      ],
    },
  ],
  gallery: [
    {
      src: "/guan-hao/zhaojunjie-with-chu-haixu-2026-07-09.webp",
      alt: "褚海旭和赵俊杰在校园走廊里的照片",
      eyebrow: "CAMPUS DUO · 2026.07.09",
      title: "褚海旭与赵俊杰",
      note: "校园走廊中的同框抓拍，作为两位同学共同出现的影像归入赵俊杰个人页。",
    },
    {
      src: "/guan-hao/daily-zhaojunjie-wet-hair.webp",
      alt: "赵俊杰早上洗完头后站在宿舍里",
      eyebrow: "WET HAIR · 01",
      title: "洗完头后 · 第一幕",
      note: "宿舍清晨，刚洗完头后的生活化定格。",
    },
    {
      src: "/guan-hao/zhaojunjie-wet-hair-02.webp",
      alt: "赵俊杰洗完头后在宿舍床铺旁的抓拍",
      eyebrow: "WET HAIR · 02",
      title: "洗完头后 · 第二幕",
      note: "从上铺视角留下的清晨抓拍。",
    },
    {
      src: "/guan-hao/zhaojunjie-wet-hair-03.webp",
      alt: "赵俊杰洗完头后在宿舍整理衣物的抓拍",
      eyebrow: "WET HAIR · 03",
      title: "洗完头后 · 第三幕",
      note: "同一清晨的另一瞬间，继续归入洗头系列。",
    },
    {
      src: "/guan-hao/zhaojunjie-daily-01.webp",
      alt: "赵俊杰在宿舍靠近镜头的抓拍",
      eyebrow: "DORM LIFE · 01",
      title: "靠近镜头",
      note: "镜头突然拉近，留下带着广角感的日常画面。",
    },
    {
      src: "/guan-hao/zhaojunjie-daily-02.webp",
      alt: "赵俊杰在宿舍里的动态失焦抓拍",
      eyebrow: "DORM LIFE · 02",
      title: "失焦一瞬",
      note: "动作先于快门，模糊也成为现场感的一部分。",
    },
    {
      src: "/guan-hao/zhaojunjie-daily-03.webp",
      alt: "赵俊杰趴在床铺上玩游戏",
      eyebrow: "DORM LIFE · 03",
      title: "游戏进行时",
      note: "横握设备、专注屏幕，和本页视频属于同一组宿舍记录。",
    },
    {
      src: "/guan-hao/zhaojunjie-daily-04.webp",
      alt: "赵俊杰在宿舍里专注看向下方",
      eyebrow: "DORM LIFE · 04",
      title: "专注时刻",
      note: "低机位记录下的一次安静专注。",
    },
    {
      src: "/guan-hao/zhaojunjie-daily-05.webp",
      alt: "赵俊杰趴在宿舍床铺边看向镜头",
      eyebrow: "DORM LIFE · 05",
      title: "床铺边的定格",
      note: "偏冷色的宿舍光线里，一次松弛的镜头对视。",
    },
    {
      src: "/guan-hao/zhaojunjie-daily-06.webp",
      alt: "赵俊杰凑近镜头的超近距离照片",
      eyebrow: "DORM LIFE · 06",
      title: "超近距离",
      note: "广角镜头下，画面被眼神完全占据。",
    },
    {
      src: "/guan-hao/zhaojunjie-daily-07.webp",
      alt: "赵俊杰在宿舍靠墙休息的照片",
      eyebrow: "DORM LIFE · 07",
      title: "靠墙片刻",
      note: "一天中的短暂停顿，被镜头安静收录。",
    },
  ],
};

export default function ZhaoJunjiePage() {
  return <PersonProfile profile={profile} />;
}
