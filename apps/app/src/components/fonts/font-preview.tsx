"use client";

import { useEffect, useRef, useState } from "react";

import { fontDownloadPath } from "@typefolio/core/api";
import type { FontFile } from "@typefolio/core/types";

const loaded = new Set<string>();

export function FontPreview({
  libraryId,
  font,
  text,
  className,
  style,
}: {
  libraryId: string;
  font?: FontFile;
  text: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const family = font ? `tf-${font.id}` : undefined;

  useEffect(() => {
    if (!font || !libraryId) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      if (loaded.has(font.id)) {
        setReady(true);
        return;
      }
      try {
        const face = new FontFace(
          `tf-${font.id}`,
          `url(${fontDownloadPath(libraryId, font.id)})`,
        );
        await face.load();
        document.fonts.add(face);
        loaded.add(font.id);
        setReady(true);
      } catch {
        setReady(false);
      }
    }, { rootMargin: "120px" });

    observer.observe(node);
    return () => observer.disconnect();
  }, [font, libraryId]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        fontFamily: ready && family ? `"${family}", serif` : undefined,
        ...style,
      }}
    >
      {text}
    </div>
  );
}
