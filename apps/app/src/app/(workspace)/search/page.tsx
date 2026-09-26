"use client";

import { useState } from "react";

import { SearchOverlay } from "@/components/search/search-overlay";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function SearchPage() {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <PageHeader
        title="Search"
        description="A command centre for fonts and collections."
      />
      <Button onClick={() => setOpen(true)}>Open search</Button>
      <SearchOverlay open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
