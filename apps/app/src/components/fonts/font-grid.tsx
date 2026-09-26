"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { FontFamilyGroup } from "@typefolio/core/types";

import { FontCard } from "@/components/fonts/font-card";

export function FontGrid({
  families,
  selected,
  onSelect,
  columns = 4,
}: {
  families: FontFamilyGroup[];
  selected: string[];
  onSelect: (slug: string, additive: boolean) => void;
  columns?: number;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rows = Math.ceil(families.length / columns);
  const virtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 320,
    overscan: 3,
  });

  if (families.length <= 24) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {families.map((family) => (
          <FontCard
            key={family.id ?? family.familyName}
            family={family}
            selected={selected.includes(family.slug ?? "")}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-[70vh] overflow-auto">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((row) => {
          const start = row.index * columns;
          const slice = families.slice(start, start + columns);
          return (
            <div
              key={row.key}
              className="absolute left-0 grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5"
              style={{ transform: `translateY(${row.start}px)` }}
            >
              {slice.map((family) => (
                <FontCard
                  key={family.id ?? family.familyName}
                  family={family}
                  selected={selected.includes(family.slug ?? "")}
                  onSelect={onSelect}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
