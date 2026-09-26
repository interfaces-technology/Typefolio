"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { searchLibrary } from "@typefolio/core/api";
import type { SearchResults } from "@typefolio/core/types";

import { useLibrary } from "@/components/library/library-provider";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { library } = useLibrary();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);

  useEffect(() => {
    if (!open || !library) return;
    const handle = window.setTimeout(async () => {
      if (!query.trim()) {
        setResults(null);
        return;
      }
      setResults(await searchLibrary(library.id, query));
    }, 180);
    return () => window.clearTimeout(handle);
  }, [open, query, library]);

  const groups = useMemo(() => {
    if (!results) return [];
    return [
      {
        heading: "Fonts",
        items: results.fonts.map((font) => ({
          href: `/fonts/${font.slug}`,
          label: font.familyName,
        })),
      },
      {
        heading: "Collections",
        items: results.collections.map((collection) => ({
          href: `/collections/${collection.slug}`,
          label: collection.name,
        })),
      },
      {
        heading: "Foundries",
        items: results.foundries.map((foundry) => ({
          href: `/fonts?q=${encodeURIComponent(foundry)}`,
          label: foundry,
        })),
      },
    ].filter((group) => group.items.length > 0);
  }, [results]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Search"
      description="Search fonts and collections"
    >
      <Command>
        <CommandInput
          placeholder="Search fonts and collections..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>{query ? "No matches." : "Type to search your library."}</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.heading} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href + item.label}
                  value={item.label}
                  onSelect={() => {
                    router.push(item.href);
                    onClose();
                  }}
                >
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
