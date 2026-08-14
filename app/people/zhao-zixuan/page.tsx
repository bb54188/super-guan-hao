import type { Metadata } from "next";
import { PersonProfile, type PersonProfileData } from "../person-profile";

export const metadata: Metadata = {
  title: "赵梓轩人物档案｜超级大关昊",
  description: "赵梓轩（足球）的同班人物档案。",
};

const profile: PersonProfileData = {
  name: "赵梓轩",
  romanName: "ZHAO ZIXUAN",
  index: "02",
  alias: "足球",
  role: "关键角色",
  intro: "关昊最喜欢的“足球”，也是24级四班人物宇宙里固定登场的高频角色。",
  portrait: "/guan-hao/cast-football.webp",
  portraitAlt: "赵梓轩的头像照片",
  theme: "football",
  tags: ["足球", "同班角色", "高频登场"],
};

export default function ZhaoZixuanPage() {
  return <PersonProfile profile={profile} />;
}
