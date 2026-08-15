/* eslint-disable @next/next/no-html-link-for-pages */

import { QualityVideo, type VideoQualitySource } from "../components/quality-video";

type PersonMedia =
  | {
      kind: "video";
      sources: VideoQualitySource[];
      poster: string;
      eyebrow: string;
      title: string;
      note: string;
      specs: Array<{ value: string; label: string }>;
    }
  | {
      kind: "photo";
      src: string;
      alt: string;
      eyebrow: string;
      title: string;
      note: string;
    };

type PersonPhoto = {
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  note: string;
};

type PersonVideo = {
  sources: VideoQualitySource[];
  poster: string;
  eyebrow: string;
  title: string;
  note: string;
  specs: Array<{ value: string; label: string }>;
};

type PersonArticleSection = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  beats?: string[];
  quote?: string;
  after?: string[];
};

type PersonArticle = {
  kicker: string;
  title: string;
  lead: string[];
  sections: PersonArticleSection[];
  closing: string[];
};

type PersonFact = {
  label: string;
  value: string;
};

export type PersonProfileData = {
  name: string;
  romanName: string;
  index: string;
  alias: string;
  role: string;
  intro: string;
  quote?: string;
  portrait: string;
  portraitAlt: string;
  theme: "guan" | "football" | "nailong" | "bg";
  tags: string[];
  facts?: PersonFact[];
  media?: PersonMedia;
  videos?: PersonVideo[];
  videoArchiveNote?: string;
  gallery?: PersonPhoto[];
  article?: PersonArticle;
};

export function PersonProfile({ profile }: { profile: PersonProfileData }) {
  return (
    <main className={`person-page person-theme-${profile.theme}`}>
      <nav className="person-nav" aria-label="人物页导航">
        <a className="brand" href="/" aria-label="返回超级大关昊首页">
          <span className="brand-mark">GH</span>
          <span className="brand-copy">
            超级大关昊
            <small>SUPER GUAN HAO</small>
          </span>
        </a>
        <span className="person-nav-location">人物档案 · {profile.index}</span>
        <a className="person-back-link" href="/#crew">
          返回人物图鉴 <span aria-hidden="true">↙</span>
        </a>
      </nav>

      <section className="person-hero" aria-labelledby="person-name">
        <div className="person-hero-copy">
          <p className="section-kicker">CHARACTER FILE · {profile.index}</p>
          <span className="person-role">{profile.role}</span>
          <h1 id="person-name">{profile.name}</h1>
          <p className="person-roman">{profile.romanName}</p>
          <p className="person-alias">代号「{profile.alias}」</p>
          <p className="person-intro">{profile.intro}</p>
          {profile.quote && (
            <blockquote className="person-signature-quote">
              <span>人物名言</span>
              <strong>“{profile.quote}”</strong>
            </blockquote>
          )}
          <ul className="person-tags" aria-label="人物标签">
            {profile.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
          {!!profile.facts?.length && (
            <dl className="person-facts" aria-label={`${profile.name}人物信息`}>
              {profile.facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <figure className="person-portrait-card">
          <span className="person-file-number">NO. {profile.index}</span>
          <img src={profile.portrait} alt={profile.portraitAlt} />
          <figcaption>
            <small>24级四班 · CHARACTER ARCHIVE</small>
            <strong>{profile.name}</strong>
            <span>{profile.alias}</span>
          </figcaption>
        </figure>
      </section>

      {profile.article && (
        <article className="person-article section-pad" aria-labelledby="person-article-title">
          <header className="person-article-heading">
            <div>
              <p className="section-kicker">{profile.article.kicker}</p>
              <h2 id="person-article-title">{profile.article.title}</h2>
            </div>
            <div className="person-article-lead">
              {profile.article.lead.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </header>

          <div className="person-article-chapters">
            {profile.article.sections.map((section, index) => (
              <section className="person-article-chapter" key={section.title}>
                <header>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <small>{section.eyebrow}</small>
                  <h3>{section.title}</h3>
                </header>
                <div className="person-article-prose">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.beats && (
                    <ul className="person-article-beats">
                      {section.beats.map((beat) => <li key={beat}>{beat}</li>)}
                    </ul>
                  )}
                  {section.quote && <blockquote>{section.quote}</blockquote>}
                  {section.after?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </section>
            ))}
          </div>

          <footer className="person-article-closing">
            <span>FINAL NOTE</span>
            {profile.article.closing.map((paragraph, index) => (
              index === profile.article!.closing.length - 1
                ? <strong key={paragraph}>{paragraph}</strong>
                : <p key={paragraph}>{paragraph}</p>
            ))}
          </footer>
        </article>
      )}

      <section className="person-media section-pad" aria-labelledby="person-media-title">
        <header className="person-media-heading">
          <div>
            <p className="section-kicker">RELATED MEDIA</p>
            <h2 id="person-media-title">相关影像。</h2>
          </div>
          <p>属于这位人物的照片与视频，统一在此页归档。</p>
        </header>

        {profile.media?.kind === "video" && (
          <figure className="person-video-feature">
            <div className="person-video-screen">
              <QualityVideo
                sources={profile.media.sources}
                poster={profile.media.poster}
                ariaLabel={`${profile.name}相关视频：${profile.media.title}`}
              />
              <span>{profile.media.eyebrow}</span>
            </div>
            <figcaption>
              <small>{profile.media.eyebrow}</small>
              <strong>{profile.media.title}</strong>
              <p>{profile.media.note}</p>
              <dl aria-label="视频规格">
                {profile.media.specs.map((spec) => (
                  <div key={spec.value}>
                    <dt>{spec.value}</dt>
                    <dd>{spec.label}</dd>
                  </div>
                ))}
              </dl>
            </figcaption>
          </figure>
        )}

        {profile.media?.kind === "photo" && (
          <figure className="person-photo-feature">
            <div className="person-photo-frame">
              <img src={profile.media.src} alt={profile.media.alt} />
              <span>{profile.media.eyebrow}</span>
            </div>
            <figcaption>
              <small>{profile.media.eyebrow}</small>
              <strong>{profile.media.title}</strong>
              <p>{profile.media.note}</p>
            </figcaption>
          </figure>
        )}

        {!!profile.videos?.length && (
          <section className="person-video-gallery" aria-labelledby="person-video-gallery-title">
            <header>
              <div>
                <p className="section-kicker">PERSONAL VIDEO ARCHIVE</p>
                <h3 id="person-video-gallery-title">{profile.name}动态影像册。</h3>
              </div>
              <p>{profile.videoArchiveNote ?? "属于这位人物的更多动态片段，统一归入个人影像页。"}</p>
            </header>
            <div className="person-video-gallery-grid">
              {profile.videos.map((video) => (
                <figure className="person-video-card" key={video.sources[0].src}>
                  <div className="person-video-card-screen">
                    <QualityVideo
                      sources={video.sources}
                      poster={video.poster}
                      ariaLabel={`${profile.name}个人视频：${video.title}`}
                    />
                    <span>{video.eyebrow}</span>
                  </div>
                  <figcaption>
                    <small>{video.eyebrow}</small>
                    <strong>{video.title}</strong>
                    <p>{video.note}</p>
                    <dl aria-label={`${video.title}视频规格`}>
                      {video.specs.map((spec) => (
                        <div key={`${video.sources[0].src}-${spec.label}`}>
                          <dt>{spec.value}</dt>
                          <dd>{spec.label}</dd>
                        </div>
                      ))}
                    </dl>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {!!profile.gallery?.length && (
          <section className="person-photo-gallery" aria-labelledby="person-photo-gallery-title">
            <header>
              <div>
                <p className="section-kicker">PERSONAL PHOTO ARCHIVE</p>
                <h3 id="person-photo-gallery-title">{profile.name}个人影像册。</h3>
              </div>
              <p>清晨抓拍、宿舍日常与校园片段，点击照片可查看完整画面。</p>
            </header>
            <div className="person-photo-gallery-grid">
              {profile.gallery.map((photo, index) => (
                <figure className="person-gallery-card" key={photo.src}>
                  <a
                    href={photo.src}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`查看${photo.title}完整照片`}
                  >
                    <img src={photo.src} alt={photo.alt} loading={index > 2 ? "lazy" : "eager"} />
                    <span>{photo.eyebrow}</span>
                  </a>
                  <figcaption>
                    <strong>{photo.title}</strong>
                    <p>{photo.note}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {!profile.media && !profile.videos?.length && !profile.gallery?.length && (
          <div className="person-media-empty">
            <span>ARCHIVE OPEN</span>
            <strong>人物页已建立，更多影像等待收录。</strong>
            <p>当前人物档案照已经归位；后续新增素材会继续放在这里。</p>
          </div>
        )}
      </section>

      <section className="person-next">
        <p>继续浏览</p>
        <div>
          <a href="/#crew">返回同班人物图鉴 <span aria-hidden="true">↗</span></a>
          <a href="/#gallery">查看关昊影像档案 <span aria-hidden="true">↗</span></a>
        </div>
      </section>

      <footer className="person-footer">
        <a href="/">超级大关昊</a>
        <p>非官方校园影像档案 · 仅供同学间欣赏</p>
        <p>© 2026 CHARACTER ARCHIVE</p>
        <p className="photo-credit">照片由千秋雯提供</p>
      </footer>
    </main>
  );
}
