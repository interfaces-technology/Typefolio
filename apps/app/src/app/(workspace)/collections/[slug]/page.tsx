"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { addCollectionItem, getCollection, removeCollectionItem } from "@typefolio/core/api";
import type { CollectionDetail } from "@typefolio/core/types";

import { FontCard } from "@/components/fonts/font-card";
import { useLibrary } from "@/components/library/library-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, SkeletonBlock } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function CollectionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { library, families, refresh } = useLibrary();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!library) return;
    getCollection(library.id, slug)
      .then((result) => setCollection(result.collection))
      .catch((caught: Error) => setError(caught.message));
  }, [library, slug]);

  const items = useMemo(() => {
    if (!collection) return { fonts: [], notes: [] };
    return {
      fonts: collection.items
        .filter((item) => item.itemType === "family")
        .map((item) => families.find((family) => family.id === item.itemId))
        .filter(Boolean),
      notes: collection.items.filter((item) => item.itemType === "note"),
    };
  }, [collection, families]);

  if (error) return <ErrorState body={error} />;
  if (!collection) return <SkeletonBlock className="h-64" />;

  return (
    <div>
      <PageHeader
        title={collection.name}
        meta={`${collection.fontCount} fonts`}
        description={collection.description}
      />
      <Tabs defaultValue="fonts">
        <TabsList>
          <TabsTrigger value="fonts">Fonts</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="fonts">
          <div className="grid gap-4 md:grid-cols-3">
            {items.fonts.map((family) =>
              family ? <FontCard key={family.id} family={family} /> : null,
            )}
          </div>
        </TabsContent>
        <TabsContent value="notes" className="space-y-4">
          {items.notes.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <p>{item.noteBody}</p>
                {library ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    onClick={async () => {
                      await removeCollectionItem(library.id, slug, item.id);
                      toast("Removed");
                      const next = await getCollection(library.id, slug);
                      setCollection(next.collection);
                      await refresh();
                    }}
                  >
                    Remove
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note" />
          <Button
            onClick={async () => {
              if (!library || !note.trim()) return;
              const next = await addCollectionItem(library.id, slug, {
                itemType: "note",
                noteBody: note,
              });
              setCollection(next.collection);
              setNote("");
              toast("Added");
            }}
          >
            Add note
          </Button>
        </TabsContent>
      </Tabs>
      {items.fonts.length === 0 && items.notes.length === 0 ? (
        <EmptyState title="Empty collection" body="Add fonts from their cards." />
      ) : null}
    </div>
  );
}
