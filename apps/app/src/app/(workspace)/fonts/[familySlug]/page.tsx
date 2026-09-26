"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  createShareLink,
  deleteFont,
  fontDownloadPath,
  fontGlyphsPath,
  getFamily,
  toggleFamilyFavorite,
} from "@typefolio/core/api";
import type { FontFamilyGroup, FontFile } from "@typefolio/core/types";

import { FontPreview } from "@/components/fonts/font-preview";
import { useLibrary } from "@/components/library/library-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorState, SkeletonBlock } from "@/components/ui/feedback";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { formatBytes } from "@/lib/format";

const WEIGHT_LABELS: Record<number, string> = {
  100: "Thin",
  200: "Extra Light",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semibold",
  700: "Bold",
  800: "Extrabold",
  900: "Black",
};

export default function FontDetailPage() {
  const { familySlug } = useParams<{ familySlug: string }>();
  const { library, refresh, collections, families } = useLibrary();
  const [family, setFamily] = useState<FontFamilyGroup | null>(null);
  const [installState, setInstallState] = useState("none");
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("The quick brown fox jumps over the lazy dog.");
  const [size, setSize] = useState(72);
  const [tracking, setTracking] = useState(0);
  const [leading, setLeading] = useState(1);
  const [align, setAlign] = useState<"left" | "center" | "right">("left");
  const [weightFont, setWeightFont] = useState<FontFile>();
  const [glyphs, setGlyphs] = useState<number[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<FontFile | null>(null);

  useEffect(() => {
    if (!library) return;
    getFamily(library.id, familySlug)
      .then((result) => {
        setFamily(result.family);
        setInstallState(result.installState);
        setWeightFont(result.family.fonts[0]);
      })
      .catch((caught: Error) => setError(caught.message));
  }, [library, familySlug]);

  useEffect(() => {
    if (!library || !weightFont) return;
    fetch(fontGlyphsPath(library.id, weightFont.id), { credentials: "include" })
      .then((response) => response.json())
      .then((data: { codepoints?: number[] }) => setGlyphs(data.codepoints ?? []))
      .catch(() => setGlyphs([]));
  }, [library, weightFont]);

  const related = useMemo(
    () =>
      families
        .filter(
          (item) =>
            item.slug !== family?.slug &&
            (item.classification === family?.classification || item.foundry === family?.foundry),
        )
        .slice(0, 4),
    [families, family],
  );

  const inUse = collections.filter(() => Boolean(family?.id));

  if (error) {
    return <ErrorState body={error} />;
  }

  if (!family || !library) {
    return <SkeletonBlock className="h-96" />;
  }

  const installLabel =
    installState === "installed"
      ? "Installed"
      : installState === "partial"
        ? "Syncing..."
        : "Install font";

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        <Link href="/fonts" className="hover:underline">
          Fonts
        </Link>{" "}
        / {family.familyName}
      </p>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{family.foundry ?? "Unknown foundry"}</Badge>
            <Badge variant="outline">{family.version ?? "—"}</Badge>
            <Badge variant="outline">{family.styleCount} styles</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{family.familyName}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              await toggleFamilyFavorite(library.id, family.slug ?? familySlug);
              toast(family.favoritedAt ? "Removed" : "Saved");
              await refresh();
            }}
          >
            {family.favoritedAt ? "Saved" : "Save"}
          </Button>
          <Button
            onClick={() => {
              if (!weightFont) return;
              window.open(fontDownloadPath(library.id, weightFont.id), "_blank");
            }}
          >
            {installLabel}
          </Button>
          <Button variant="ghost" onClick={() => setShareOpen(true)}>
            Share
          </Button>
        </div>
      </div>

      <FontPreview
        libraryId={library.id}
        font={weightFont}
        text={family.familyName}
        className="break-words text-6xl tracking-tight md:text-8xl"
      />

      <Card>
        <CardContent className="pt-6">
          <div
            contentEditable
            suppressContentEditableWarning
            className="min-h-32 outline-none"
            style={{
              fontSize: size,
              letterSpacing: `${tracking / 1000}em`,
              lineHeight: leading,
              textAlign: align,
              fontFamily: weightFont ? `"tf-${weightFont.id}", serif` : undefined,
            }}
            onBlur={(event) => setText(event.currentTarget.textContent || text)}
          >
            {text}
          </div>
          <Separator className="my-6" />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Size {size}px</Label>
              <Slider value={[size]} min={24} max={220} onValueChange={([value]) => setSize(value ?? 72)} />
            </div>
            <div className="space-y-2">
              <Label>Tracking {tracking}</Label>
              <Slider
                value={[tracking]}
                min={-40}
                max={80}
                onValueChange={([value]) => setTracking(value ?? 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Leading {leading.toFixed(2)}</Label>
              <Slider
                value={[leading]}
                min={0.8}
                max={2}
                step={0.05}
                onValueChange={([value]) => setLeading(value ?? 1)}
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {family.fonts.map((font) => (
              <Badge
                key={font.id}
                variant={weightFont?.id === font.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setWeightFont(font)}
              >
                {WEIGHT_LABELS[font.weight ?? 400] ?? font.styleName ?? "Regular"}
              </Badge>
            ))}
            {(["left", "center", "right"] as const).map((value) => (
              <Badge
                key={value}
                variant={align === value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setAlign(value)}
              >
                {value}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setExpanded(true)}>
              Expand
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Glyphs</h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 md:grid-cols-12">
          {glyphs.slice(0, 120).map((code) => (
            <Card key={code} size="sm" className="items-center py-3 text-center">
              <FontPreview
                libraryId={library.id}
                font={weightFont}
                text={String.fromCodePoint(code)}
                className="text-2xl"
              />
              <p className="text-[10px] text-muted-foreground">
                U+{code.toString(16).toUpperCase().padStart(4, "0")}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Family", family.familyName, true],
              ["Foundry", family.foundry ?? "—", !(family.editedFields ?? []).includes("foundry")],
              ["Version", family.version ?? "—", !(family.editedFields ?? []).includes("version")],
              ["Classification", family.classification ?? "—", true],
              ["License", family.license ?? "—", false],
              ["Languages", (family.languages ?? []).join(" · ") || "Latin", true],
            ].map(([label, value, detected]) => (
              <div key={String(label)} className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{String(label)}</span>
                <span className="text-right">
                  {String(value)}
                  {detected ? (
                    <Badge variant="outline" className="ml-2">
                      Detected
                    </Badge>
                  ) : null}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {family.fonts.map((font) => (
              <div key={font.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p>{font.originalName}</p>
                  <p className="text-muted-foreground">
                    {formatBytes(font.size)} · {font.extension.replace(".", "").toUpperCase()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={fontDownloadPath(library.id, font.id)}>Download</a>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(font)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">In use</h2>
        <p className="text-sm text-muted-foreground">
          {inUse.length ? inUse.map((collection) => collection.name).join(" · ") : "Not in a collection yet."}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Related fonts</h2>
        {family.classification ? (
          <p className="text-sm text-muted-foreground">Related because: {family.classification}</p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-4">
          {related.map((item) => (
            <Button key={item.id} variant="outline" asChild>
              <Link href={`/fonts/${item.slug}`}>{item.familyName}</Link>
            </Button>
          ))}
        </div>
      </section>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{family.familyName}</DialogTitle>
          </DialogHeader>
          <div
            className="text-[12vw] leading-none"
            style={{ fontFamily: weightFont ? `"tf-${weightFont.id}", serif` : undefined }}
          >
            {text}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share {family.familyName}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Anyone with the link</p>
          <Button
            onClick={async () => {
              const result = await createShareLink(library.id, {
                resourceType: "family",
                resourceId: family.id ?? familySlug,
              });
              setShareUrl(result.share.url);
              await navigator.clipboard.writeText(result.share.url);
              toast("Link copied");
            }}
          >
            Copy link
          </Button>
          {shareUrl ? <p className="break-all text-sm text-muted-foreground">{shareUrl}</p> : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirmDelete)} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete font?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the file from your Typefolio library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDelete) return;
                await deleteFont(library.id, confirmDelete.id);
                toast("Deleted");
                setConfirmDelete(null);
                await refresh();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
