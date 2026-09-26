"use client";

import { FontCard } from "@/components/fonts/font-card";
import { useLibrary } from "@/components/library/library-provider";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { dateBucket } from "@/lib/format";

const ORDER = ["Today", "Yesterday", "This week", "Earlier"] as const;

export default function RecentPage() {
  const { families } = useLibrary();
  const grouped = ORDER.map((label) => ({
    label,
    families: families.filter((family) =>
      family.createdAt ? dateBucket(family.createdAt) === label : label === "Earlier",
    ),
  })).filter((group) => group.families.length > 0);

  return (
    <div>
      <PageHeader title="Recently added" />
      {grouped.length === 0 ? (
        <EmptyState title="Nothing new" body="New typefaces will appear here after upload." />
      ) : (
        grouped.map((group) => (
          <section key={group.label} className="mb-10 space-y-4">
            <h2 className="text-sm font-medium">{group.label}</h2>
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
              {group.families.map((family) => (
                <FontCard key={family.id} family={family} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
