"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Columns2,
  Scan,
  Search,
  Settings2,
  Waves,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  applyCase,
  axisLabel,
  defaultAxisValues,
  loadSpecimenFont,
  SPECIMEN_SAMPLES,
  specimenStyle,
} from "@/lib/specimen";
import type { FontFile, VariableAxis } from "@/lib/types";
import { cn } from "cn";

type Tab = "specimen" | "waterfall" | "compare" | "glyphs";

interface SpecimenStudioProps {
  libraryId: string;
  families: Array<{ familyName: string; fonts: FontFile[] }>;
  initialFamily?: string;
  initialFontId?: string;
  initialTab?: Tab;
  compareEnabled?: boolean;
}

const CASES = [
  { id: "none", label: "Aa" },
  { id: "uppercase", label: "AA" },
  { id: "lowercase", label: "aa" },
  { id: "title", label: "AaTt" },
] as const;

const ALIGNS = [
  { id: "left", label: "Left", icon: AlignLeft },
  { id: "center", label: "Center", icon: AlignCenter },
  { id: "right", label: "Right", icon: AlignRight },
] as const;

const THEMES = [
  { id: "light", label: "Light", color: "bg-white text-slate-900" },
  {
    id: "dark",
    label: "Dark",
    color: "bg-slate-900 text-white",
  },
  {
    id: "grid",
    label: "Blueprint",
    color:
      "bg-slate-900 text-white [background-image:linear-gradient(#33415566_1px,transparent_1px),linear-gradient(90deg,#33415566_1px,transparent_1px)] [background-size:24px_24px]",
  },
] as const;

const WATERFALL_SIZES = [12, 16, 20, 28, 40, 64, 96, 144];

function fontLabel(font: FontFile): string {
  const style = font.styleName ? ` · ${font.styleName}` : "";
  return `${font.familyName}${style}`;
}

function AxisControls({
  axes,
  font,
  onChange,
}: {
  axes: Record<string, number>;
  font: FontFile;
  onChange: (next: Record<string, number>) => void;
}) {
  if (!font.variableAxes?.length) {
    return null;
  }

  return (
    <div className="grid gap-3">
      {font.variableAxes.map((axis: VariableAxis) => (
        <div key={axis.tag} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{axisLabel(axis)}</span>
            <span className="tabular-nums text-muted-foreground">
              {axes[axis.tag] ?? axis.defaultValue}
            </span>
          </div>
          <input
            type="range"
            min={axis.min}
            max={axis.max}
            step={axis.tag === "wght" ? 1 : 0.001}
            value={axes[axis.tag] ?? axis.defaultValue}
            aria-label={`${axisLabel(axis)} axis`}
            className="w-full accent-foreground"
            onChange={(event) =>
              onChange({ ...axes, [axis.tag]: Number(event.target.value) })
            }
          />
        </div>
      ))}
    </div>
  );
}

function NumberControl({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        className="w-full accent-foreground"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: ReadonlyArray<{ id: T; label: string; icon?: typeof AlignLeft }>;
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.id)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon ? <Icon className="size-3.5" /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function useRegisterFont(libraryId: string, font: FontFile | undefined) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!font) {
      return;
    }
    let cancelled = false;
    loadSpecimenFont(libraryId, font)
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [libraryId, font]);

  return ready;
}

interface FontAsyncProps {
  libraryId: string;
  font: FontFile;
  text: string;
  size: number;
  tracking?: number;
  leading?: number;
  axes?: Record<string, number>;
  style?: React.CSSProperties;
  className?: string;
  title?: string;
}

function FontLine({
  libraryId,
  font,
  text,
  size,
  tracking = 0,
  leading = 1.15,
  axes,
  style,
  className,
  title,
}: FontAsyncProps) {
  const ready = useRegisterFont(libraryId, font);

  return (
    <div
      style={{
        fontSize: size,
        letterSpacing: tracking,
        lineHeight: leading,
        ...(ready ? specimenStyle(font, axes) : { fontFamily: "sans-serif" }),
        ...style,
      }}
      title={title}
      className={cn("min-w-0 overflow-hidden break-words", className)}
    >
      {text}
    </div>
  );
}

function GlyphMap({
  libraryId,
  font,
}: {
  libraryId: string;
  font: FontFile;
}) {
  const [codepoints, setCodepoints] = useState<number[] | null>(null);
  const [glyphCount, setGlyphCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forFontId, setForFontId] = useState<string | null>(null);
  const ready = useRegisterFont(libraryId, font);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/libraries/${libraryId}/fonts/${font.id}/glyphs`)
      .then(async (response) => {
        const data = (await response.json()) as {
          error?: string;
          codepoints?: number[];
          glyphCount?: number | null;
        };
        if (!response.ok) {
          throw new Error(data.error ?? "Could not load glyph map");
        }
        if (cancelled) {
          return;
        }
        setCodepoints(data.codepoints ?? []);
        setForFontId(font.id);
        setGlyphCount(data.glyphCount ?? null);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setForFontId(font.id);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [libraryId, font]);

  if (error && forFontId === font.id) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!codepoints || forFontId !== font.id) {
    return <p className="text-sm text-muted-foreground">Reading glyph coverage…</p>;
  }

  const buckets = bucketCodepoints(codepoints);
  const populated = buckets.filter((bucket) => bucket.codepoints.length > 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {ready ? (
          <>
            {populated.length} scripts · {glyphCount ?? codepoints.length} glyphs
          </>
        ) : (
          "Preparing font…"
        )}
      </p>

      {populated.map((bucket) => (
        <div key={bucket.name} className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <h4 className="text-sm font-medium">{bucket.name}</h4>
            <span className="text-xs tabular-nums text-muted-foreground">
              {bucket.codepoints.length}
            </span>
          </div>
          <div className="grid grid-cols-8 gap-px overflow-hidden rounded-lg border bg-muted sm:grid-cols-12 md:grid-cols-16">
            {bucket.codepoints.slice(0, 512).map((cp) => (
              <div
                key={cp}
                className={cn(
                  "flex aspect-square items-center justify-center bg-background text-lg",
                  !ready && "font-sans",
                )}
                style={ready ? specimenStyle(font) : undefined}
                title={`U+${cp.toString(16).toUpperCase().padStart(4, "0")}`}
              >
                {String.fromCodePoint(cp)}
              </div>
            ))}
          </div>
          {bucket.codepoints.length > 512 ? (
            <p className="text-xs text-muted-foreground">
              Showing 512 of {bucket.codepoints.length} — the rest are hidden.
            </p>
          ) : null}
        </div>
      ))}

      {populated.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No character coverage found for this font.
        </p>
      ) : null}
    </div>
  );
}

interface GlyphBucket {
  name: string;
  start: number;
  end: number;
  codepoints: number[];
}

const GLYPH_BUCKETS: Array<Omit<GlyphBucket, "codepoints">> = [
  { name: "Basic Latin", start: 0x20, end: 0x7f },
  { name: "Latin-1 Supplement", start: 0xa0, end: 0xff },
  { name: "Latin Extended-A", start: 0x100, end: 0x17f },
  { name: "Latin Extended-B", start: 0x180, end: 0x24f },
  { name: "IPA Extensions", start: 0x250, end: 0x2af },
  { name: "Spacing Modifiers", start: 0x2b0, end: 0x2ff },
  { name: "Greek", start: 0x370, end: 0x3ff },
  { name: "Cyrillic", start: 0x400, end: 0x4ff },
  { name: "Hebrew", start: 0x590, end: 0x5ff },
  { name: "Arabic", start: 0x600, end: 0x6ff },
  { name: "Devanagari", start: 0x900, end: 0x97f },
  { name: "Thai", start: 0xe00, end: 0xe7f },
  { name: "Latin Extended Additional", start: 0x1e00, end: 0x1eff },
  { name: "Greek Extended", start: 0x1f00, end: 0x1fff },
  { name: "General Punctuation", start: 0x2000, end: 0x206f },
  { name: "Currency Symbols", start: 0x20a0, end: 0x20cf },
  { name: "Letterlike Symbols", start: 0x2100, end: 0x214f },
  { name: "Arrows", start: 0x2190, end: 0x21ff },
  { name: "Mathematical Operators", start: 0x2200, end: 0x22ff },
  { name: "Box Drawing", start: 0x2500, end: 0x257f },
  { name: "Dingbats", start: 0x2700, end: 0x27bf },
  { name: "CJK Symbols & Punctuation", start: 0x3000, end: 0x303f },
  { name: "Hiragana", start: 0x3040, end: 0x309f },
  { name: "Katakana", start: 0x30a0, end: 0x30ff },
  { name: "CJK Unified Ideographs", start: 0x4e00, end: 0x9fff },
  { name: "Hangul Syllables", start: 0xac00, end: 0xd7af },
];

function bucketCodepoints(codepoints: number[]): GlyphBucket[] {
  return GLYPH_BUCKETS.map((bucket) => ({
    ...bucket,
    codepoints: codepoints.filter(
      (cp) => cp >= bucket.start && cp <= bucket.end,
    ),
  }));
}

function FamilyPicker({
  families,
  aFontId,
  bFontId,
  onSelect,
  activeSource,
  onSource,
}: {
  families: Array<{ familyName: string; fonts: FontFile[] }>;
  aFontId?: string;
  bFontId?: string;
  onSelect: (font: FontFile) => void;
  activeSource: "a" | "b";
  onSource: (source: "a" | "b") => void;
}) {
  const [query, setQuery] = useState("");
  const [openFamily, setOpenFamily] = useState<string | null>(
    families[0]?.familyName ?? null,
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return families;
    }
    return families
      .filter((family) => family.familyName.toLowerCase().includes(q))
      .map((family) => ({
        ...family,
        fonts: family.fonts.filter((font) =>
          fontLabel(font).toLowerCase().includes(q),
        ),
      }))
      .filter((family) => family.fonts.length > 0);
  }, [families, query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search families…"
          className="pl-8"
          aria-label="Search families"
        />
      </div>

      <div className="flex items-center gap-1 text-xs">
        <span className="text-muted-foreground">Assign to</span>
        <Segmented
          ariaLabel="Which column the picker assigns to"
          options={[
            { id: "a", label: "A" },
            { id: "b", label: "B" },
          ]}
          value={activeSource}
          onChange={onSource}
        />
      </div>

      <div className="max-h-[60vh] space-y-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No families match.
          </p>
        ) : null}

        {filtered.map((family) => {
          const isOpen = openFamily === family.familyName;
          return (
            <div key={family.familyName} className="rounded-lg border bg-card">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-medium"
                onClick={() =>
                  setOpenFamily(isOpen ? null : family.familyName)
                }
              >
                <span className="truncate">{family.familyName}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {family.fonts.length}
                </span>
              </button>
              {isOpen ? (
                <div className="space-y-1 border-t px-2 py-2">
                  {family.fonts.map((font) => {
                    const isA = font.id === aFontId;
                    const isB = font.id === bFontId;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => onSelect(font)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                          isA
                            ? "bg-primary/10 text-primary"
                            : isB
                              ? "bg-secondary text-secondary-foreground"
                              : "hover:bg-muted",
                        )}
                      >
                        <span className="flex min-w-0 items-baseline gap-2">
                          <span className="truncate">
                            {font.styleName ?? "Regular"}
                          </span>
                          {font.variableAxes?.length ? (
                            <span className="shrink-0 text-xs text-primary/70">
                              Variable
                            </span>
                          ) : null}
                        </span>
                        <Badge variant="outline" className="shrink-0">
                          {isB ? "B" : isA ? "A" : font.weight ?? "—"}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SpecimenStudio({
  libraryId,
  families,
  initialFamily,
  initialFontId,
  initialTab = "specimen",
  compareEnabled = true,
}: SpecimenStudioProps) {
  const allFonts = useMemo(
    () => families.flatMap((family) => family.fonts),
    [families],
  );
  const byId = useMemo(
    () => new Map(allFonts.map((font) => [font.id, font])),
    [allFonts],
  );

  const initialFont = useMemo(() => {
    if (initialFontId) {
      const direct = byId.get(initialFontId);
      if (direct) {
        return direct;
      }
    }
    if (initialFamily) {
      const match = families.find(
        (family) =>
          family.familyName.toLowerCase() === initialFamily.toLowerCase(),
      );
      if (match?.fonts[0]) {
        return match.fonts[0];
      }
    }
    return allFonts[0];
  }, [initialFamily, initialFontId, allFonts, byId, families]);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [fontA, setFontA] = useState<FontFile | undefined>(initialFont);
  const [axesA, setAxesA] = useState<Record<string, number>>(() =>
    initialFont ? defaultAxisValues(initialFont) : {},
  );
  const [fontB, setFontB] = useState<FontFile | undefined>(undefined);
  const [axesB, setAxesB] = useState<Record<string, number>>({});
  const [source, setSource] = useState<"a" | "b">("a");

  const [text, setText] = useState(SPECIMEN_SAMPLES[0].text);
  const [sampleId, setSampleId] = useState(SPECIMEN_SAMPLES[0].id);
  const [size, setSize] = useState(64);
  const [tracking, setTracking] = useState(0);
  const [leading, setLeading] = useState(1.15);
  const [align, setAlign] = useState<"center" | "left" | "right">("center");
  const [casing, setCasing] = useState<(typeof CASES)[number]["id"]>("none");
  const [themeId, setThemeId] = useState<(typeof THEMES)[number]["id"]>("light");
  const [pairing, setPairing] = useState(true);

  function changeFont(font: FontFile, target: "a" | "b") {
    if (target === "a") {
      setFontA(font);
      setAxesA(defaultAxisValues(font));
    } else {
      setFontB(font);
      setAxesB(defaultAxisValues(font));
    }
  }

  function selectFont(font: FontFile) {
    if (source === "b") {
      changeFont(font, "b");
      if (!fontA) {
        const other = allFonts.find((candidate) => candidate.id !== font.id);
        if (other) {
          changeFont(other, "a");
        }
      }
    } else {
      changeFont(font, "a");
      if (tab === "compare" && !fontB) {
        const other = allFonts.find((candidate) => candidate.id !== font.id);
        changeFont(other ?? font, "b");
      }
    }
    setTab(tab === "compare" ? "compare" : "specimen");
  }

  function resetAll() {
    setText(SPECIMEN_SAMPLES[0].text);
    setSampleId(SPECIMEN_SAMPLES[0].id);
    setSize(64);
    setTracking(0);
    setLeading(1.15);
    setAlign("center");
    setCasing("none");
    setThemeId("light");
  }

  const rendered = applyCase(text, casing);
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  const singleFont = fontA;
  const singleAxes = axesA;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="lg:w-72 lg:shrink-0">
        <div className="rounded-xl border bg-card p-4">
          <FamilyPicker
            families={families}
            aFontId={fontA?.id}
            bFontId={pairing ? fontB?.id : undefined}
            onSelect={selectFont}
            activeSource={source}
            onSource={setSource}
          />
        </div>
      </aside>

      <section className="min-w-0 flex-1 space-y-4">
        <Tabs value={tab} onValueChange={(next) => setTab(next as Tab)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList variant="line">
              <TabsTrigger value="specimen">
                <Settings2 />
                Specimen
              </TabsTrigger>
              <TabsTrigger value="waterfall">
                <Waves />
                Waterfall
              </TabsTrigger>
              {compareEnabled ? (
                <TabsTrigger value="compare">
                  <Columns2 />
                  Compare
                </TabsTrigger>
              ) : null}
              <TabsTrigger value="glyphs">
                <Scan />
                Glyphs
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="specimen">
            <div className="flex flex-col gap-4 xl:flex-row">
              <Controls
                text={text}
                onTextChange={(next) => {
                  setText(next);
                  setSampleId("custom");
                }}
                sampleId={sampleId}
                onSample={(id) => {
                  const sample = SPECIMEN_SAMPLES.find((s) => s.id === id);
                  setSampleId(id);
                  if (sample) {
                    setText(sample.text);
                  }
                }}
                size={size}
                onSize={setSize}
                tracking={tracking}
                onTracking={setTracking}
                leading={leading}
                onLeading={setLeading}
                align={align}
                onAlign={setAlign}
                casing={casing}
                onCasing={setCasing}
                themeId={themeId}
                onTheme={setThemeId}
                onReset={resetAll}
              />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{fontA?.familyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {fontA?.styleName ?? "Regular"}
                      {fontA?.variableAxes?.length
                        ? ` · ${fontA.variableAxes.length} axis variable`
                        : fontA?.weight
                          ? ` · ${fontA.weight}`
                          : ""}
                    </p>
                  </div>
                  {singleFont?.variableAxes?.length ? (
                    <button
                      type="button"
                      onClick={() => setAxesA(defaultAxisValues(singleFont!))}
                      className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      Reset axes
                    </button>
                  ) : null}
                </div>

                <div className="flex items-center justify-center overflow-hidden rounded-xl border font-normal">
                  <div
                    className={cn(
                      "flex min-h-[300px] w-full items-center justify-center px-6 py-10 transition-colors",
                      theme.color,
                    )}
                  >
                    {singleFont ? (
                      <FontLine
                        libraryId={libraryId}
                        font={singleFont}
                        text={rendered}
                        size={size}
                        tracking={tracking}
                        leading={leading}
                        axes={singleAxes}
                        style={{ textAlign: align, textTransform: "none" }}
                        className="max-w-3xl"
                      />
                    ) : (
                      <p className="text-muted-foreground">
                        Choose a family to preview.
                      </p>
                    )}
                  </div>
                </div>

                {singleFont?.variableAxes?.length ? (
                  <div className="rounded-xl border bg-card p-4">
                    <AxisControls
                      axes={singleAxes}
                      font={singleFont}
                      onChange={setAxesA}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="waterfall">
            <div className="flex flex-col gap-4">
              <Controls
                text={text}
                onTextChange={(next) => {
                  setText(next);
                  setSampleId("custom");
                }}
                sampleId={sampleId}
                onSample={(id) => {
                  const sample = SPECIMEN_SAMPLES.find((s) => s.id === id);
                  setSampleId(id);
                  if (sample) {
                    setText(sample.text);
                  }
                }}
                size={size}
                onSize={setSize}
                tracking={tracking}
                onTracking={setTracking}
                leading={leading}
                onLeading={setLeading}
                align={align}
                onAlign={setAlign}
                casing={casing}
                onCasing={setCasing}
                themeId={themeId}
                onTheme={setThemeId}
                onReset={resetAll}
              />

              <div
                className={cn(
                  "space-y-px overflow-hidden rounded-xl border font-normal",
                  theme.color,
                )}
              >
                {singleFont
                  ? WATERFALL_SIZES.map((waterSize) => (
                      <div
                        key={waterSize}
                        className="grid grid-cols-[4ch_1fr] items-baseline gap-3 px-4 py-2"
                      >
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {waterSize}
                        </span>
                        <FontLine
                          libraryId={libraryId}
                          font={singleFont}
                          text={rendered}
                          size={waterSize}
                          tracking={tracking}
                          leading={1.2}
                          axes={singleAxes}
                          style={{ textAlign: "left" }}
                        />
                      </div>
                    ))
                  : null}
              </div>

              {singleFont?.variableAxes?.length ? (
                <div className="rounded-xl border bg-card p-4">
                  <AxisControls
                    axes={singleAxes}
                    font={singleFont}
                    onChange={setAxesA}
                  />
                </div>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="compare">
            <div className="flex flex-col gap-4">
              <Controls
                text={text}
                onTextChange={(next) => {
                  setText(next);
                  setSampleId("custom");
                }}
                sampleId={sampleId}
                onSample={(id) => {
                  const sample = SPECIMEN_SAMPLES.find((s) => s.id === id);
                  setSampleId(id);
                  if (sample) {
                    setText(sample.text);
                  }
                }}
                size={size}
                onSize={setSize}
                tracking={tracking}
                onTracking={setTracking}
                leading={leading}
                onLeading={setLeading}
                align={align}
                onAlign={setAlign}
                casing={casing}
                onCasing={setCasing}
                themeId={themeId}
                onTheme={setThemeId}
                onReset={resetAll}
              />

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={pairing}
                    onChange={(event) => setPairing(event.target.checked)}
                    className="accent-foreground"
                  />
                  Pairing mode (A = heading, B = body)
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <CompareColumn
                  title="A — Heading"
                  libraryId={libraryId}
                  font={fontA}
                  axes={axesA}
                  onAxesChange={setAxesA}
                  size={pairing && fontB ? size + 28 : size}
                  text={rendered}
                  tracking={tracking}
                  leading={leading}
                  theme={theme}
                  onFont={() => setSource("a")}
                  onReset={() => fontA && setAxesA(defaultAxisValues(fontA))}
                />
                <CompareColumn
                  title="B — Body"
                  libraryId={libraryId}
                  font={fontB}
                  axes={axesB}
                  onAxesChange={setAxesB}
                  size={pairing ? Math.max(18, size - 22) : size}
                  text={rendered}
                  tracking={tracking}
                  leading={leading}
                  theme={theme}
                  onFont={() => setSource("b")}
                  onReset={() => fontB && setAxesB(defaultAxisValues(fontB))}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="glyphs">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end gap-3">
                <FontSelect
                  label="Font"
                  fonts={allFonts}
                  value={singleFont?.id}
                  onChange={(font) => {
                    changeFont(font, "a");
                    setFontB(undefined);
                    setAxesB({});
                  }}
                />
              </div>

              {singleFont ? (
                <div className="rounded-xl border bg-card p-4">
                  <GlyphMap libraryId={libraryId} font={singleFont} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Choose a font to inspect its glyph coverage.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

function CompareColumn({
  title,
  libraryId,
  font,
  axes,
  onAxesChange,
  size,
  text,
  tracking,
  leading,
  theme,
  onFont,
  onReset,
}: {
  title: string;
  libraryId: string;
  font: FontFile | undefined;
  axes: Record<string, number>;
  onAxesChange: (next: Record<string, number>) => void;
  size: number;
  text: string;
  tracking: number;
  leading: number;
  theme: (typeof THEMES)[number];
  onFont: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex h-7 items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {title}
        </span>
        {font?.variableAxes?.length ? (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Reset axes
          </button>
        ) : null}
      </div>

      {font ? (
        <>
          <div
            className={cn(
              "flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl border px-4 py-8 text-center",
              theme.color,
            )}
          >
            <FontLine
              libraryId={libraryId}
              font={font}
              text={text}
              size={size}
              tracking={tracking}
              leading={leading}
              axes={axes}
              className="max-w-full"
            />
          </div>
          {font.variableAxes?.length ? (
            <div className="rounded-xl border bg-card p-3">
              <AxisControls
                axes={axes}
                font={font}
                onChange={onAxesChange}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={onFont}
              className="w-full rounded-lg border border-dashed px-3 py-2 text-center text-xs text-muted-foreground hover:border-foreground hover:text-foreground"
            >
              Assign column {title.slice(-1)} from the list to switch weight
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={onFont}
          className="flex min-h-[220px] w-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
        >
          Choose a font for {title.slice(-1)}
        </button>
      )}
    </div>
  );
}

function Controls({
  text,
  onTextChange,
  sampleId,
  onSample,
  size,
  onSize,
  tracking,
  onTracking,
  leading,
  onLeading,
  align,
  onAlign,
  casing,
  onCasing,
  themeId,
  onTheme,
  onReset,
}: {
  text: string;
  onTextChange: (next: string) => void;
  sampleId: string;
  onSample: (id: string) => void;
  size: number;
  onSize: (next: number) => void;
  tracking: number;
  onTracking: (next: number) => void;
  leading: number;
  onLeading: (next: number) => void;
  align: "left" | "center" | "right";
  onAlign: (next: "left" | "center" | "right") => void;
  casing: (typeof CASES)[number]["id"];
  onCasing: (next: (typeof CASES)[number]["id"]) => void;
  themeId: (typeof THEMES)[number]["id"];
  onTheme: (next: (typeof THEMES)[number]["id"]) => void;
  onReset: () => void;
}) {
  return (
    <div className="w-full space-y-4 xl:w-72 xl:shrink-0">
      <div className="rounded-xl border bg-card p-4">
        <Label htmlFor="specimen-text" className="text-xs font-medium">
          Specimen text
        </Label>
        <textarea
          id="specimen-text"
          rows={2}
          value={text}
          onChange={(event) => {
            onTextChange(event.target.value);
            onSample("custom");
          }}
          className="mt-2 min-h-14 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring/40 focus-visible:border-ring focus-visible:ring-[3px]"
        />

        <div className="mt-3 flex flex-wrap gap-1.5">
          {SPECIMEN_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSample(sample.id)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                sampleId === sample.id
                  ? "border-transparent bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs font-medium">Typography</p>
        <div className="mt-3 grid gap-4">
          <NumberControl label="Size (px)" value={size} min={10} max={180} onChange={onSize} />
          <NumberControl label="Letter spacing (px)" value={tracking} min={-10} max={40} step={0.5} onChange={onTracking} />
          <NumberControl label="Line height" value={leading} min={0.8} max={2.4} step={0.05} onChange={onLeading} />
          <div className="grid gap-1.5">
            <span className="text-xs font-medium">Align</span>
            <Segmented
              ariaLabel="Text alignment"
              options={[...ALIGNS]}
              value={align}
              onChange={onAlign}
            />
          </div>
          <div className="grid gap-1.5">
            <span className="text-xs font-medium">Case</span>
            <Segmented
              ariaLabel="Text case"
              options={CASES}
              value={casing}
              onChange={onCasing}
            />
          </div>
          <div className="grid gap-1.5">
            <span className="text-xs font-medium">Background</span>
            <Segmented
              ariaLabel="Canvas theme"
              options={[...THEMES]}
              value={themeId}
              onChange={onTheme}
            />
          </div>
        </div>

        <Separator className="my-4" />

        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          <X className="size-4" />
          Reset controls
        </Button>
      </div>
    </div>
  );
}

function FontSelect({
  label,
  fonts,
  value,
  onChange,
}: {
  label: string;
  fonts: FontFile[];
  value: string | undefined;
  onChange: (font: FontFile) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <select
        value={value}
        onChange={(event) => {
          const font = fonts.find((f) => f.id === event.target.value);
          if (font) {
            onChange(font);
          }
        }}
        aria-label={label}
        className="h-9 w-full max-w-sm rounded-lg border bg-background px-3 text-sm outline-none ring-ring/40 focus-visible:border-ring focus-visible:ring-[3px]"
      >
        {fonts.map((font) => (
          <option key={font.id} value={font.id}>
            {fontLabel(font)}
          </option>
        ))}
      </select>
    </div>
  );
}