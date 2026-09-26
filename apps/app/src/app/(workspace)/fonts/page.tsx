"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Grid3x3Icon, ListIcon, SlidersHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import { addCollectionItem, createCollection, uploadFonts } from "@typefolio/core/api";
import type { FontClassification, FontFamilyGroup } from "@typefolio/core/types";

import { FontGrid } from "@/components/fonts/font-grid";
import { useLibrary } from "@/components/library/library-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, ErrorState, SkeletonBlock } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCount } from "@/lib/format";

const CLASSIFICATIONS: FontClassification[] = ["serif", "sans", "mono", "display"];

function FontsPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { status, error, refresh, families, library, collections } = useLibrary();
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const q = params.get("q") ?? "";
  const classification = params.get("classification") ?? "";
  const sort = params.get("sort") ?? "newest";

  const filtered = useMemo(() => {
    return families
      .filter((family) =>
        q
          ? family.familyName.toLowerCase().includes(q.toLowerCase()) ||
            (family.foundry ?? "").toLowerCase().includes(q.toLowerCase())
          : true,
      )
      .filter((family) =>
        classification ? family.classification === classification : true,
      )
      .slice()
      .sort((a, b) => {
        if (sort === "name-asc") return a.familyName.localeCompare(b.familyName);
        if (sort === "name-desc") return b.familyName.localeCompare(a.familyName);
        return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      });
  }, [families, q, classification, sort]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/fonts?${next.toString()}`);
  };

  if (status === "loading") {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-72" />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return <ErrorState body={error ?? "We couldn't load your fonts."} onRetry={() => void refresh()} />;
  }

  return (
    <div>
      <PageHeader
        title="Fonts"
        meta={formatCount(families.length, "typeface")}
        description="Browse your typography library."
        action={
          <label>
            <input
              type="file"
              accept=".otf,.ttf,.woff,.woff2"
              multiple
              hidden
              onChange={async (event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length === 0) return;
                try {
                  const result = await uploadFonts(files);
                  toast(
                    result.rejected.length
                      ? `${result.added} uploaded, ${result.rejected.length} rejected`
                      : `${result.added} uploaded`,
                  );
                  await refresh();
                } catch {
                  toast.error("Upload failed.");
                }
              }}
            />
            <Button asChild>
              <span>Add font</span>
            </Button>
          </label>
        }
      />

      <div
        className="mb-6 rounded-xl border bg-card p-3"
        onDragOver={(event) => event.preventDefault()}
        onDrop={async (event) => {
          event.preventDefault();
          const files = Array.from(event.dataTransfer.files);
          if (!files.length) return;
          await uploadFonts(files);
          toast("Uploaded");
          await refresh();
        }}
      >
        <Input
          value={q}
          placeholder="Search fonts..."
          onChange={(event) => setParam("q", event.target.value)}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {["", ...CLASSIFICATIONS].map((value) => (
              <Badge
                key={value || "all"}
                variant={classification === value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setParam("classification", value)}
              >
                {value || "All"}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setFilterOpen(true)}>
              <SlidersHorizontalIcon />
              Filter
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select value={sort} onValueChange={(value) => setParam("sort", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="updated">Recently updated</SelectItem>
                <SelectItem value="name-asc">Name A–Z</SelectItem>
                <SelectItem value="name-desc">Name Z–A</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              aria-label="Grid"
              onClick={() => setView("grid")}
            >
              <Grid3x3Icon />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              aria-label="List"
              onClick={() => setView("list")}
            >
              <ListIcon />
            </Button>
          </div>
        </div>
      </div>

      {selected.length > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
          <p className="text-sm">{selected.length} selected</p>
          <Button variant="ghost" size="sm" onClick={() => setPickerOpen(true)}>
            Add to collection
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/compare?ids=${selected.join(",")}`)}
          >
            Compare {Math.min(selected.length, 4)}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState title="No fonts yet" body="Drop OTF, TTF, WOFF or WOFF2 files here." />
      ) : view === "list" ? (
        <div className="grid gap-2">
          {filtered.map((family) => (
            <Button
              key={family.id ?? family.familyName}
              variant="outline"
              className="h-auto justify-between px-4 py-3"
              onClick={() => router.push(`/fonts/${family.slug}`)}
            >
              <span>{family.familyName}</span>
              <span className="text-muted-foreground">{family.styleCount} styles</span>
            </Button>
          ))}
        </div>
      ) : (
        <FontGrid
          families={filtered}
          selected={selected}
          onSelect={(slug, additive) => {
            setSelected((current) => {
              if (!additive) return current.includes(slug) ? [] : [slug];
              return current.includes(slug)
                ? current.filter((item) => item !== slug)
                : [...current, slug];
            });
          }}
        />
      )}

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="grid gap-3 px-4">
            <p className="text-sm font-medium">Style</p>
            {CLASSIFICATIONS.map((value) => (
              <Label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={classification === value}
                  onChange={() => setParam("classification", classification === value ? "" : value)}
                />
                {value}
              </Label>
            ))}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setParam("classification", "")}>
              Reset
            </Button>
            <Button onClick={() => setFilterOpen(false)}>Apply</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to collection</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            {collections.map((collection) => (
              <Button
                key={collection.id}
                variant="outline"
                className="justify-start"
                onClick={async () => {
                  if (!library) return;
                  const selectedFamilies = selected
                    .map((slug) => families.find((family) => family.slug === slug))
                    .filter((family): family is FontFamilyGroup => Boolean(family?.id));
                  for (const family of selectedFamilies) {
                    await addCollectionItem(library.id, collection.slug, {
                      itemType: "family",
                      itemId: family.id,
                    });
                  }
                  toast(`Added to ${collection.name}`);
                  setPickerOpen(false);
                  await refresh();
                }}
              >
                {collection.name}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(true)}>
              New collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            placeholder="Editorial"
            onChange={(event) => setNewName(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!library || !newName.trim()) return;
                await createCollection(library.id, { name: newName });
                toast("Collection created");
                setCreateOpen(false);
                setNewName("");
                await refresh();
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FontsPage() {
  return (
    <Suspense fallback={<SkeletonBlock className="h-64" />}>
      <FontsPageInner />
    </Suspense>
  );
}
