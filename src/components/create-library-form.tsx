"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLibrary } from "@/lib/api";

export function CreateLibraryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Give your library a name");
      return;
    }

    setIsSubmitting(true);
    try {
      const library = await createLibrary({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      toast.success("Library created");
      router.push(`/library/${library.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not create library";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="library-name">Library name</Label>
        <Input
          id="library-name"
          placeholder="Work fonts, Brand A, Presentation set…"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="library-description">Description (optional)</Label>
        <Textarea
          id="library-description"
          placeholder="Headlines and body text for client decks"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={300}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creating…
          </>
        ) : (
          "Create library"
        )}
      </Button>
    </form>
  );
}
