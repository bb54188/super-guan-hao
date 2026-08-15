"use client";

import { useState } from "react";

export type PersonPhoto = {
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  note: string;
  series?: string;
};

export type PersonPhotoSeries = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
};

type PhotoSeriesGalleryProps = {
  name: string;
  photos: PersonPhoto[];
  series?: PersonPhotoSeries[];
  archiveNote?: string;
};

export function PhotoSeriesGallery({
  name,
  photos,
  series = [],
  archiveNote,
}: PhotoSeriesGalleryProps) {
  const availableSeries = series
    .map((item) => ({
      ...item,
      photos: photos.filter((photo) => photo.series === item.id),
    }))
    .filter((item) => item.photos.length > 0);
  const fallbackSeries = {
    id: "all",
    eyebrow: "COMPLETE ARCHIVE",
    title: "全部照片",
    description: "属于这位人物的全部照片记录。",
    photos,
  };
  const groups = availableSeries.length > 0 ? availableSeries : [fallbackSeries];
  const [activeId, setActiveId] = useState(groups[0].id);
  const activeSeries = groups.find((item) => item.id === activeId) ?? groups[0];

  return (
    <section className="person-photo-gallery" aria-labelledby="person-photo-gallery-title">
      <header>
        <div>
          <p className="section-kicker">PERSONAL PHOTO SERIES</p>
          <h3 id="person-photo-gallery-title">{name}影像系列。</h3>
        </div>
        <p>{archiveNote ?? "照片已经按画面内容整理；点击系列名称即可切换查看。"}</p>
      </header>

      <div className="person-photo-series-tabs" role="group" aria-label={`${name}照片系列`}>
        {groups.map((item, index) => (
          <button
            className={`person-photo-series-tab${item.id === activeSeries.id ? " is-active" : ""}`}
            id={`person-photo-series-tab-${item.id}`}
            key={item.id}
            type="button"
            aria-pressed={item.id === activeSeries.id}
            aria-controls="person-photo-series-panel"
            onClick={() => setActiveId(item.id)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <small>{item.eyebrow}</small>
            <strong>{item.title}</strong>
            <em>{item.photos.length} 张</em>
          </button>
        ))}
      </div>

      <div
        className="person-photo-series-panel"
        id="person-photo-series-panel"
        aria-live="polite"
      >
        <div className="person-photo-series-summary">
          <div>
            <small>{activeSeries.eyebrow}</small>
            <strong>{activeSeries.title}</strong>
            <p>{activeSeries.description}</p>
          </div>
          <span>{String(activeSeries.photos.length).padStart(2, "0")} FRAMES</span>
        </div>

        <div className="person-photo-gallery-grid">
          {activeSeries.photos.map((photo, index) => (
            <figure className="person-gallery-card" key={photo.src}>
              <a
                href={photo.src}
                target="_blank"
                rel="noreferrer"
                aria-label={`查看${photo.title}完整照片`}
              >
                <img src={photo.src} alt={photo.alt} loading={index > 1 ? "lazy" : "eager"} />
                <span>{photo.eyebrow}</span>
              </a>
              <figcaption>
                <strong>{photo.title}</strong>
                <p>{photo.note}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
