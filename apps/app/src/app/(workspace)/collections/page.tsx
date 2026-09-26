"use client";

import { useState } from "react";
import { toast } from "sonner";

import { addCollectionItem, createCollection } from "@typefolio/core/api";

import { CollectionCard } from "@/components/collections/collection-card";
import { useLibrary } from "@/components/library/library-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { formatCount } from "@/lib/format";

export default function CollectionsPage() {
  const { status, error, refresh, collections, library } = useLibrary();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dropSlug, setDropSlug] = useState<string | null>(null);

  if (status === "error") {
    return <ErrorState body={error ?? "We couldn't load collections."} onRetry={() => void refresh()} />;
  }

  return (
    <div>
      <PageHeader
        title="Collections"
        meta={formatCount(collections.length, "collection")}
        action={<Button onClick={() => setOpen(true)}>New collection</Button>}
      />
      {collections.length === 0 ? (
        <EmptyState
          title="No collections yet"
          body="Group fonts into archives."
          action={{ label: "Create collection", onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {collections.map((collection) => (
            <div
              key={collection.id}
              onDragOver={(event) => {
                event.preventDefault();
                setDropSlug(collection.slug);
              }}
              onDragLeave={() => setDropSlug(null)}
              onDrop={async (event) => {
                event.preventDefault();
                const familyId = event.dataTransfer.getData("text/family-id");
                if (library && familyId) {
                  await addCollectionItem(library.id, collection.slug, {
                    itemType: "family",
                    itemId: familyId,
                  });
                  toast(`Added to ${collection.name}`);
                  await refresh();
                }
                setDropSlug(null);
              }}
            >
              <CollectionCard
                collection={collection}
                dropActive={dropSlug === collection.slug}
              />
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
          </DialogHeader>
          <Input placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
          <Textarea
            placeholder="Quiet and structured type..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!library || !name.trim()) return;
                await createCollection(library.id, { name, description });
                toast("Collection created");
                setOpen(false);
                setName("");
                setDescription("");
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
