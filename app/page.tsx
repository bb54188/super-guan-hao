"use client";

import { useEffect, useState } from "react";
import { QualityVideo, type VideoQualitySource } from "./components/quality-video";

const returnHomeworkVideoSources: VideoQualitySource[] = [
  {
    src: "/guan-hao/return-homework-2026-08-01.mp4",
    label: "1080P 原画",
    width: 1920,
    height: 1080,
  },
  {
    src: "/guan-hao/return-homework-2026-08-01-720p.mp4",
    label: "720P 流畅",
    width: 1280,
    height: 720,
  },
];

const quotes = [
  "笑的是给",
  "你配吗？你不配，没素质，你别叫",
  "不行",
  "chou！",
  "shi chi shi shi……",
  "黑肾！",
];

const photos = [
  {
    src: "/guan-hao/campus.webp",
    title: "操场定格",
    note: "阳光正好，主角入场。",
    alt: "关昊在校园操场上的照片",
    shape: "portrait",
  },
  {
    src: "/guan-hao/classroom.webp",
    title: "教室回眸",
    note: "镜头一响，自动锁定。",
    alt: "关昊坐在教室里回头看向镜头",
    shape: "wide",
  },
  {
    src: "/guan-hao/hallway.webp",
    title: "走廊名场面",
    note: "2026.08.01 · 暑假返校交作业时抓拍。",
    alt: "关昊站在校园走廊里的照片",
    shape: "wide",
  },
  {
    src: "/guan-hao/portrait.webp",
    title: "正面镜头",
    note: "无需滤镜，自带气场。",
    alt: "关昊身穿校服的近景照片",
    shape: "portrait",
  },
  {
    src: "/guan-hao/portrait-close.webp",
    title: "经典表情",
    note: "一个眼神，信息量拉满。",
    alt: "关昊的头像特写",
    shape: "square",
  },
  {
    src: "/guan-hao/hero-city.webp",
    title: "国旗下的帅照",
    note: "蓝天、旗帜与端正站姿，主角气场拉满。",
    alt: "关昊身穿校服在国旗下留影",
    shape: "portrait",
  },
  {
    src: "/guan-hao/daily-guan-after-class.webp",
    title: "下课时的关昊",
    note: "下课铃后，镜头前的一次即时回眸。",
    alt: "下课时关昊坐在教室里看向镜头",
    shape: "wide",
  },
  {
    src: "/guan-hao/daily-guan-distracted.webp",
    title: "上课时走神的关昊",
    note: "课堂片刻，视线短暂离开书页。",
    alt: "上课时关昊坐在座位上短暂走神",
    shape: "wide",
  },
];

type FeaturePhoto = {
  src: string;
  alt: string;
  kicker: string;
  title: string;
  note: string;
};

const classArchive: FeaturePhoto = {
  src: "/guan-hao/class-24-4.webp",
  alt: "24级四班全班合影",
  kicker: "CLASS OF 2024 · CLASS 4",
  title: "24级四班",
  note: "某一天的全班合影：一张照片，把整个同班宇宙装进画面。",
};

const dormVomitNight: FeaturePhoto = {
  src: "/guan-hao/302-vomit-night.jpg",
  alt: "AI演绎302宿舍深夜呕吐事件的十二格漫画",
  kicker: "EPISODE 002 · AI GENERATED",
  title: "302呕吐之夜",
  note: "一段发生在302宿舍的深夜校园传说，以十二格漫画形式收录。",
};

const crewProfiles: Array<
  FeaturePhoto & { index: string; alias: string; role: string; href: string }
> = [
  {
    src: "/guan-hao/cast-football.webp",
    alt: "赵梓轩的头像照片",
    kicker: "KEY PLAYER · 01",
    title: "赵梓轩",
    alias: "足球",
    role: "关昊最喜欢的“足球”",
    note: "固定登场的关键角色，也是同班宇宙里的高频人物。",
    index: "01",
    href: "/people/zhao-zixuan",
  },
  {
    src: "/guan-hao/cast-nailong.webp",
    alt: "尹浩哲的头像照片",
    kicker: "DUEL PLAYER · 01",
    title: "尹浩哲",
    alias: "奶龙",
    role: "校园对决选手一号",
    note: "经常与关昊展开日常切磋的两位选手之一。",
    index: "02",
    href: "/people/yin-haozhe",
  },
  {
    src: "/guan-hao/cast-bg.webp",
    alt: "赵俊杰的头像照片",
    kicker: "DUEL PLAYER · 02",
    title: "赵俊杰",
    alias: "BG / 鸡摸 / 金八",
    role: "多重代号持有者",
    note: "与关昊高频交锋的另一位选手，出场自带多个代号。",
    index: "03",
    href: "/people/zhao-junjie",
  },
];

export default function Home() {
  const [quoteIndex, setQuoteIndex] = useState(5);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [featurePhoto, setFeaturePhoto] = useState<FeaturePhoto | null>(null);

  useEffect(() => {
    if (lightboxIndex === null && !legendOpen && !featurePhoto) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxIndex(null);
        setLegendOpen(false);
        setFeaturePhoto(null);
      }
      if (event.key === "ArrowRight" && lightboxIndex !== null) {
        setLightboxIndex((current) =>
          current === null ? 0 : (current + 1) % photos.length,
        );
      }
      if (event.key === "ArrowLeft" && lightboxIndex !== null) {
        setLightboxIndex((current) =>
          current === null
            ? 0
            : (current - 1 + photos.length) % photos.length,
        );
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxIndex, legendOpen, featurePhoto]);

  const drawQuote = () => {
    setQuoteIndex((current) => {
      const offset = 1 + Math.floor(Math.random() * (quotes.length - 1));
      return (current + offset) % quotes.length;
    });
  };

  const activePhoto =
    lightboxIndex === null ? null : photos[lightboxIndex];

  return (
    <main id="top" className="site-shell">
      <nav className="nav" aria-label="主导航">
        <a className="brand" href="#top" aria-label="回到顶部">
          <span className="brand-mark">GH</span>
          <span className="brand-copy">
            超级大关昊
            <small>SUPER GUAN HAO</small>
          </span>
        </a>
        <div className="nav-links">
          <a href="#profile">人物</a>
          <a href="#legend">事迹</a>
          <a href="#quotes">名言</a>
          <a href="#gallery">图片</a>
          <a href="#video">视频</a>
          <a href="/submissions">投稿区</a>
        </div>
        <a className="nav-cta" href="/submit">
          我要投稿 <span aria-hidden="true">↗</span>
        </a>
      </nav>

      <nav className="quick-nav" aria-label="一键导航">
        <span>快速导航</span>
        <a href="#legend">事迹</a>
        <a href="#gallery">图片</a>
        <a href="#video">视频</a>
        <a href="/submissions">投稿区</a>
        <a className="quick-nav-submit" href="/submit">投稿＋</a>
      </nav>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span /> CAMPUS ORIGINAL · 2026
          </p>
          <h1 id="hero-title">
            <span className="hero-super">SUPER</span>
            <span className="hero-name">关昊</span>
            <span className="hero-outline">不止一面</span>
          </h1>
          <p className="hero-intro">
            有人靠音量出场，
            <br />
            他只需要一个眼神。
          </p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={drawQuote}>
              抽一句名言 <span aria-hidden="true">↗</span>
            </button>
            <a className="button button-ghost" href="#guan-story">
              阅读《关昊其人》
            </a>
          </div>
          <dl className="hero-stats" aria-label="站点收录数据">
            <div>
              <dt>22</dt>
              <dd>张照片</dd>
            </div>
            <div>
              <dt>06</dt>
              <dd>条名言</dd>
            </div>
            <div>
              <dt>03</dt>
              <dd>段视频</dd>
            </div>
            <div>
              <dt>01</dt>
              <dd>位主角</dd>
            </div>
          </dl>
        </div>

        <div className="hero-art" aria-label="关昊校园照片拼贴">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <a
            className="hero-image-frame"
            href="/people/guan-hao"
            aria-label="进入关昊人物页"
          >
            <img
              src="/guan-hao/campus.webp"
              alt="关昊身穿校服站在校园操场上"
              fetchPriority="high"
            />
          </a>
          <a
            className="hero-mini-photo"
            href="/people/guan-hao"
            aria-label="进入关昊人物页"
          >
            <img src="/guan-hao/portrait-close.webp" alt="关昊头像特写" />
            <span>NO. 01</span>
          </a>
          <div className="hero-sticker" aria-hidden="true">
            <span>沉默</span>
            <strong>杀手</strong>
          </div>
          <div className="hero-caption">
            <span>GUAN HAO</span>
            <strong>校园原生人物档案</strong>
          </div>
        </div>

        <div className="quote-float" aria-live="polite">
          <span>本次抽取</span>
          <strong className={quotes[quoteIndex].length > 10 ? "quote-long" : undefined}>
            “{quotes[quoteIndex]}”
          </strong>
          <button onClick={drawQuote} aria-label="再抽一句名言">
            再抽一次
          </button>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          <span>GUAN HAO</span><b>✦</b><span>校园原生</span><b>✦</b>
          <span>KEEP IT REAL</span><b>✦</b><span>超级大关昊</span><b>✦</b>
          <span>GUAN HAO</span><b>✦</b><span>校园原生</span><b>✦</b>
          <span>KEEP IT REAL</span><b>✦</b><span>超级大关昊</span><b>✦</b>
        </div>
      </div>

      <section id="profile" className="profile section-pad">
        <div className="section-heading">
          <p className="section-kicker">01 / PERSONA</p>
          <h2>镜头里的<br />每一面。</h2>
          <p>
            操场、教室、走廊——不同场景，
            <br />
            同一股松弛感。
          </p>
        </div>

        <div className="story-grid">
          <a
            className="story-card story-classroom"
            href="/people/guan-hao"
            aria-label="进入关昊人物页：教室回眸"
          >
            <div className="story-image">
              <img
                src="/guan-hao/classroom.webp"
                alt="关昊在教室回头看向镜头"
                loading="lazy"
              />
            </div>
            <div className="story-meta">
              <span>SCENE 01</span>
              <h3>教室回眸</h3>
              <p>在镜头与黑板之间，精准选择镜头。</p>
            </div>
          </a>

          <a
            className="story-card story-hallway"
            href="/people/guan-hao"
            aria-label="进入关昊人物页：走廊名场面"
          >
            <div className="story-image">
              <img
                src="/guan-hao/hallway.webp"
                alt="关昊站在校园走廊里"
                loading="lazy"
              />
            </div>
            <div className="story-meta">
              <span>SCENE 02</span>
              <h3>走廊名场面</h3>
              <p>2026年8月1日，暑假返校交作业时的同学抓拍。</p>
            </div>
          </a>

          <a
            className="story-card story-portrait"
            href="/people/guan-hao"
            aria-label="进入关昊人物页：正面镜头"
          >
            <div className="story-image">
              <img
                src="/guan-hao/portrait.webp"
                alt="关昊身穿校服的正面近景"
                loading="lazy"
              />
            </div>
            <div className="story-meta">
              <span>SCENE 03</span>
              <h3>正面镜头</h3>
              <p>不需要准备动作，站在那里就是画面。</p>
            </div>
          </a>
        </div>

        <a
          id="guan-story"
          className="profile-feature-story"
          href="/people/guan-hao"
          aria-label="阅读全文：《关昊其人》六章人物介绍"
        >
          <div className="profile-feature-index" aria-hidden="true">
            <span>FEATURE STORY</span>
            <strong>06</strong>
            <small>CHAPTERS</small>
          </div>
          <div className="profile-feature-copy">
            <p className="section-kicker">人物长篇 · 已完整收录</p>
            <h3>《关昊其人》</h3>
            <p>
              从只存在于“学校服务器”里的神秘人物，到课堂掌声、固定语音包与隐藏角色般的社交模式——六章正文，完整记录关昊无法复制的校园存在感。
            </p>
            <span className="profile-feature-link">
              阅读全文 <b>人物页 · 六章</b> <i aria-hidden="true">↗</i>
            </span>
          </div>
          <div className="profile-feature-quote">
            <small>文中摘录</small>
            <blockquote>“关昊更像一个制作组精心设计的隐藏角色。”</blockquote>
          </div>
        </a>
      </section>

      <section id="legend" className="legend section-pad">
        <div className="legend-heading">
          <div>
            <p className="section-kicker">02 / LEGEND FILE</p>
            <h2>传奇事件<br />AI 演绎篇</h2>
          </div>
          <div className="legend-intro">
            <span>EPISODE 001</span>
            <h3>关昊的“余香”</h3>
            <p>一段被同学口口相传的校园传说，以九格史诗形式重新演绎。</p>
          </div>
        </div>

        <button
          className="legend-poster"
          onClick={() => setLegendOpen(true)}
          aria-label="放大查看关昊的余香传奇事件图"
        >
          <img
            src="/guan-hao/legend-yuxiang.webp"
            alt="历史周测风格九格图，AI演绎关昊的余香传奇事件"
            width={1536}
            height={1024}
          />
          <span>点击放大 <b aria-hidden="true">↗</b></span>
        </button>

        <div className="legend-footer">
          <p>
            <strong>AI GENERATED</strong>
            图中人物均由 AI 生成，仅用于校园故事的夸张化视觉演绎。
          </p>
          <p>内容以“校园传说”形式呈现，不作为真实影像或事实记录。</p>
        </div>

        <div className="legend-episode-two">
          <div className="legend-intro">
            <span>EPISODE 002 · DORM 302</span>
            <h3>302呕吐之夜</h3>
            <p>深夜宿舍里的一场突发事件，被整理成十二格校园传说档案。</p>
          </div>

          <button
            className="legend-poster legend-poster-secondary"
            onClick={() => setFeaturePhoto(dormVomitNight)}
            aria-label="放大查看302呕吐之夜事件图"
          >
            <img
              src="/guan-hao/302-vomit-night.jpg"
              alt="AI演绎302宿舍深夜呕吐事件的十二格漫画"
              width={1536}
              height={1152}
              loading="lazy"
            />
            <span>点击放大 <b aria-hidden="true">↗</b></span>
          </button>
        </div>
      </section>

      <section id="quotes" className="quotes section-pad">
        <div className="quotes-top">
          <div>
            <p className="section-kicker">03 / QUOTE ARCHIVE</p>
            <h2>关昊名言<br />六句收录</h2>
          </div>
          <div className="quote-console" aria-live="polite">
            <span>NOW PLAYING · 0{quoteIndex + 1}</span>
            <strong className={quotes[quoteIndex].length > 10 ? "quote-long" : undefined}>
              “{quotes[quoteIndex]}”
            </strong>
            <button onClick={drawQuote}>
              随机抽取 <span aria-hidden="true">↻</span>
            </button>
          </div>
        </div>

        <ol className="quote-grid">
          {quotes.map((quote, index) => (
            <li
              key={quote}
              className={`quote-card${index === 5 ? " quote-card-final" : ""}${
                quote.length > 10 ? " quote-card-long" : ""
              }`}
            >
              <button onClick={() => setQuoteIndex(index)}>
                <span>0{index + 1}</span>
                <strong>“{quote}”</strong>
                <small>{index === 5 ? "压轴收录" : "关昊语录"}</small>
                <i aria-hidden="true">↗</i>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section id="gallery" className="gallery section-pad">
        <div className="gallery-heading">
          <div>
            <p className="section-kicker">04 / VISUAL ARCHIVE</p>
            <h2>八帧，<br />一个主角。</h2>
          </div>
          <p>点击任意影像，查看完整画面。</p>
        </div>

        <div className="gallery-grid">
          {photos.map((photo, index) => (
            <button
              className={`gallery-card gallery-${photo.shape}`}
              key={photo.src}
              onClick={() => setLightboxIndex(index)}
              aria-label={`放大查看：${photo.title}`}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                loading={index === 5 ? "eager" : "lazy"}
              />
              <span className="gallery-number">0{index + 1}</span>
              <span className="gallery-overlay">
                <strong>{photo.title}</strong>
                <small>{photo.note}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section id="video" className="video-diary section-pad">
        <div className="video-diary-heading">
          <div>
            <p className="section-kicker">05 / MOTION ARCHIVE</p>
            <h2>8月1日，<br />走廊再遇。</h2>
          </div>
          <div className="video-diary-intro">
            <span>RETURN-TO-SCHOOL · 2026</span>
            <p>
              暑假返校交作业时偶遇关昊。两秒钟的现场记录，
              把“走廊名场面”从静止照片延伸成动态影像。
            </p>
          </div>
        </div>

        <figure className="video-feature">
          <div className="video-screen">
            <QualityVideo
              sources={returnHomeworkVideoSources}
              poster="/guan-hao/return-homework-2026-08-01-poster.webp"
              ariaLabel="2026年8月1日返校交作业时在走廊遇到关昊的视频"
              loop
            />
            <span className="video-badge">VIDEO 01</span>
          </div>
          <figcaption>
            <small>SCENE 04 · HALLWAY</small>
            <strong>返校交作业，走廊偶遇关昊</strong>
            <p>2026年8月1日同学拍摄。画面已做自然校色，保留现场原声。</p>
            <dl className="video-grade-note" aria-label="视频处理说明">
              <div>
                <dt>4K · 60FPS</dt>
                <dd>原始素材</dd>
              </div>
              <div>
                <dt>1080P · 60FPS</dt>
                <dd>网页版本</dd>
              </div>
              <div>
                <dt>NATURAL</dt>
                <dd>自然校色</dd>
              </div>
            </dl>
          </figcaption>
        </figure>
      </section>

      <section id="crew" className="crew section-pad">
        <div className="crew-heading">
          <p className="section-kicker">06 / 24·04 ARCHIVE</p>
          <h2>同班宇宙<br />人物图鉴。</h2>
          <p>
            24级四班的一张合影，
            <br />
            以及关昊身边的三位高频角色。
          </p>
        </div>

        <button
          className="class-archive"
          onClick={() => setFeaturePhoto(classArchive)}
          aria-label="放大查看24级四班全班合影"
        >
          <img
            src={classArchive.src}
            alt={classArchive.alt}
            width={1800}
            height={1200}
          />
          <span className="class-stamp">24级<br />四班</span>
          <span className="class-archive-overlay">
            <small>{classArchive.kicker}</small>
            <strong>{classArchive.title}</strong>
            <b aria-hidden="true">↗</b>
          </span>
        </button>

        <div className="crew-divider">
          <span>KEY CHARACTERS</span>
          <p>“足球”与两位校园对决选手，正式进入人物档案。</p>
        </div>

        <div className="cast-grid">
          {crewProfiles.map((profile) => (
            <a
              className="cast-card"
              key={profile.title}
              href={profile.href}
              aria-label={`进入${profile.title}的人物页`}
            >
              <span className="cast-photo">
                <img src={profile.src} alt={profile.alt} />
                <b>{profile.index}</b>
              </span>
              <span className="cast-copy">
                <small>{profile.kicker}</small>
                <strong className="cast-name">{profile.title}</strong>
                <em className={profile.alias.length > 8 ? "alias-long" : undefined}>
                  代号「{profile.alias}」
                </em>
                <span>{profile.role}</span>
                <p>{profile.note}</p>
                <b className="cast-link">进入人物页 <i aria-hidden="true">↗</i></b>
              </span>
            </a>
          ))}
        </div>

        <p className="crew-disclaimer">
          人物代号与“对决”均为同学间校园梗化称呼，不代表真实冲突或负面评价。
        </p>
      </section>

      <section className="closing">
        <a
          className="closing-photo"
          href="/people/guan-hao"
          aria-label="进入关昊人物页"
        >
          <img
            src="/guan-hao/portrait.webp"
            alt="关昊身穿校服的正面近景"
            loading="lazy"
          />
        </a>
        <div className="closing-copy">
          <span>THE ONE &amp; ONLY</span>
          <h2>超级大<br />关昊。</h2>
          <p>故事仍在继续，名场面持续更新。</p>
          <a href="#top">回到开场 <span aria-hidden="true">↑</span></a>
        </div>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark">GH</span>
          <span className="brand-copy">
            超级大关昊
            <small>SUPER GUAN HAO</small>
          </span>
        </a>
        <p>非官方校园影像档案 · 仅供同学间欣赏</p>
        <p>© 2026 GUAN HAO ARCHIVE</p>
        <p className="photo-credit">部分照片由千秋雯提供</p>
      </footer>

      {activePhoto && lightboxIndex !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${activePhoto.title}大图`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLightboxIndex(null);
          }}
        >
          <button
            className="lightbox-close"
            onClick={() => setLightboxIndex(null)}
            aria-label="关闭大图"
          >
            ×
          </button>
          <button
            className="lightbox-arrow lightbox-prev"
            onClick={() =>
              setLightboxIndex(
                (lightboxIndex - 1 + photos.length) % photos.length,
              )
            }
            aria-label="上一张照片"
          >
            ←
          </button>
          <figure>
            <img src={activePhoto.src} alt={activePhoto.alt} />
            <figcaption>
              <span>0{lightboxIndex + 1} / 0{photos.length}</span>
              <strong>{activePhoto.title}</strong>
              <small>{activePhoto.note}</small>
            </figcaption>
          </figure>
          <button
            className="lightbox-arrow lightbox-next"
            onClick={() =>
              setLightboxIndex((lightboxIndex + 1) % photos.length)
            }
            aria-label="下一张照片"
          >
            →
          </button>
        </div>
      )}

      {legendOpen && (
        <div
          className="lightbox legend-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="关昊的余香传奇事件大图"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLegendOpen(false);
          }}
        >
          <button
            className="lightbox-close"
            onClick={() => setLegendOpen(false)}
            aria-label="关闭传奇事件大图"
          >
            ×
          </button>
          <figure className="legend-lightbox-figure">
            <img
              src="/guan-hao/legend-yuxiang.webp"
              alt="历史周测风格九格图，AI演绎关昊的余香传奇事件"
            />
            <figcaption>
              <span>AI GENERATED · EPISODE 001</span>
              <strong>关昊的“余香”</strong>
              <small>画面人物均由 AI 生成，内容为校园传说的夸张化演绎。</small>
            </figcaption>
          </figure>
        </div>
      )}

      {featurePhoto && (
        <div
          className="lightbox feature-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${featurePhoto.title}大图`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFeaturePhoto(null);
          }}
        >
          <button
            className="lightbox-close"
            onClick={() => setFeaturePhoto(null)}
            aria-label="关闭人物档案大图"
          >
            ×
          </button>
          <figure className="feature-lightbox-figure">
            <img src={featurePhoto.src} alt={featurePhoto.alt} />
            <figcaption>
              <span>{featurePhoto.kicker}</span>
              <strong>{featurePhoto.title}</strong>
              <small>{featurePhoto.note}</small>
            </figcaption>
          </figure>
        </div>
      )}
    </main>
  );
}
