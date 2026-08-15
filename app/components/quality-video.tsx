"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type VideoQualitySource = {
  src: string;
  label: string;
  width: number;
  height: number;
};

type QualityVideoProps = {
  sources: VideoQualitySource[];
  poster: string;
  ariaLabel: string;
  loop?: boolean;
  autoPlayOnMobile?: boolean;
};

type ConnectionInfo = {
  downlink?: number;
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
};

type ResumeState = {
  currentTime: number;
  shouldResume: boolean;
};

function closestSource(sources: VideoQualitySource[], targetHeight: number) {
  return (
    sources.find((source) => source.height === targetHeight) ??
    sources.find((source) => source.height < targetHeight) ??
    sources[sources.length - 1]!
  );
}

function chooseAutomaticSource(sources: VideoQualitySource[]) {
  const fallback = closestSource(sources, 1080);

  if (typeof navigator === "undefined") return fallback;

  const connection = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
  if (!connection) return fallback;

  const effectiveType = connection.effectiveType ?? "";
  const downlink = connection.downlink;

  if (
    connection.saveData ||
    effectiveType === "slow-2g" ||
    effectiveType === "2g" ||
    effectiveType === "3g" ||
    (typeof downlink === "number" && downlink < 5)
  ) {
    return sources[sources.length - 1]!;
  }

  if (typeof downlink === "number" && downlink >= 15) {
    return sources[0];
  }

  return fallback;
}

export function QualityVideo({
  sources,
  poster,
  ariaLabel,
  loop = false,
  autoPlayOnMobile = false,
}: QualityVideoProps) {
  const orderedSources = useMemo(
    () => [...sources].sort((left, right) => right.height - left.height),
    [sources],
  );
  const initialSource = closestSource(orderedSources, 1080);
  const [mode, setMode] = useState<"auto" | string>("auto");
  const [activeSource, setActiveSource] = useState(initialSource);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resumeRef = useRef<ResumeState | null>(null);
  const mobileAutoplayAttemptedRef = useRef(false);

  const switchSource = useCallback((nextSource: VideoQualitySource) => {
    setActiveSource((currentSource) => {
      if (currentSource.src === nextSource.src) return currentSource;

      const video = videoRef.current;
      if (video) {
        resumeRef.current = {
          currentTime: video.currentTime,
          shouldResume: !video.paused,
        };
      }

      return nextSource;
    });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const resume = resumeRef.current;
    if (!video || !resume) return;

    const restorePlayback = () => {
      if (Number.isFinite(video.duration)) {
        video.currentTime = Math.min(resume.currentTime, Math.max(video.duration - 0.05, 0));
      }
      if (resume.shouldResume) {
        void video.play().catch(() => undefined);
      }
      resumeRef.current = null;
    };

    video.addEventListener("loadedmetadata", restorePlayback, { once: true });
    video.load();

    return () => video.removeEventListener("loadedmetadata", restorePlayback);
  }, [activeSource]);

  useEffect(() => {
    if (mode !== "auto") return;

    const connection = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
    const updateAutomaticQuality = () => switchSource(chooseAutomaticSource(orderedSources));

    updateAutomaticQuality();
    connection?.addEventListener?.("change", updateAutomaticQuality);

    return () => connection?.removeEventListener?.("change", updateAutomaticQuality);
  }, [mode, orderedSources, switchSource]);

  useEffect(() => {
    if (!autoPlayOnMobile || mobileAutoplayAttemptedRef.current) return;

    const mobileViewport = window.matchMedia("(max-width: 900px)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (!mobileViewport && !coarsePointer) return;

    const video = videoRef.current;
    if (!video) return;

    mobileAutoplayAttemptedRef.current = true;
    video.autoplay = true;
    video.defaultMuted = true;
    video.muted = true;

    const startPlayback = () => {
      void video.play().catch(() => undefined);
    };

    startPlayback();
    video.addEventListener("canplay", startPlayback, { once: true });

    return () => video.removeEventListener("canplay", startPlayback);
  }, [autoPlayOnMobile]);

  const handleQualityChange = (nextMode: string) => {
    setMode(nextMode);
    if (nextMode === "auto") {
      switchSource(chooseAutomaticSource(orderedSources));
      return;
    }

    const requestedHeight = Number(nextMode);
    switchSource(closestSource(orderedSources, requestedHeight));
  };

  return (
    <div className="quality-video">
      <video
        ref={videoRef}
        controls
        playsInline
        loop={loop}
        data-autoplay-mobile={autoPlayOnMobile ? "true" : undefined}
        preload="metadata"
        poster={poster}
        aria-label={ariaLabel}
      >
        <source src={activeSource.src} type="video/mp4" />
        你的浏览器暂不支持播放此视频。
      </video>

      <div className="quality-control">
        <label>
          <span>清晰度</span>
          <select
            value={mode}
            onChange={(event) => handleQualityChange(event.target.value)}
            aria-label={`${ariaLabel}清晰度`}
          >
            <option value="auto">自动</option>
            {orderedSources.map((source) => (
              <option value={String(source.height)} key={source.src}>
                {source.label}
              </option>
            ))}
          </select>
        </label>
        <span className="quality-active" aria-live="polite">
          {mode === "auto" ? "AUTO · " : ""}{activeSource.label}
        </span>
      </div>
    </div>
  );
}
