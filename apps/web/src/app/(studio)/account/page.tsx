import { redirect } from "next/navigation";

import { DeleteAccount } from "@/components/delete-account";
import { getMe, getSessionUser } from "@/lib/api-server";
import { formatWhen } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const [session, me] = await Promise.all([getSessionUser(), getMe()]);
  if (!session || !me) {
    redirect("/auth/sign-in?next=/account");
  }

  const rows = [
    ["Email", session.email],
    ["Email status", me.user.emailVerified ? "Verified" : "Not verified"],
    ["Plan", me.entitlement.plan === "pro" ? "Pro" : "Free"],
    ["Status", me.entitlement.status.replace("_", " ")],
    [
      "Renews",
      me.entitlement.currentPeriodEnd
        ? formatWhen(me.entitlement.currentPeriodEnd)
        : "—",
    ],
  ] as const;

  return (
    <main className="flex flex-1 flex-col gap-10">
      <header className="space-y-2">
        <h1 className="text-[1.75rem] font-semibold">Account</h1>
        <p className="text-muted-foreground">{session.name || session.email}</p>
      </header>

      <dl className="max-w-lg divide-y divide-border rounded-lg border border-border bg-card">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="max-w-lg space-y-3">
        <h2 className="text-base font-medium">Delete account</h2>
        <p className="text-sm text-muted-foreground">
          Removes the library and every font file stored for this account.
        </p>
        <DeleteAccount />
      </section>
    </main>
  );
}
