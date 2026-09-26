import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { BillingPanel } from "@/components/billing-panel";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { DeviceList } from "@/components/device-list";
import { UsageSummary } from "@/components/usage-summary";
import { auth } from "@typefolio/core/auth/server";
import { getPublicBillingPlans } from "@typefolio/core/billing/plans";
import { listDevices } from "@typefolio/core/devices";
import { getUserEntitlement } from "@typefolio/core/entitlements";
import { getOrCreateUserLibrary } from "@typefolio/core/storage";
import type { SubscriptionStatus } from "@typefolio/core/types";

export const dynamic = "force-dynamic";

interface AccountPageProps {
  searchParams: Promise<{ checkout?: string }>;
}

function formatStatus(status: SubscriptionStatus): string {
  if (status === "past_due") {
    return "Past due";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const { checkout } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const [library, entitlement] = await Promise.all([
    getOrCreateUserLibrary(session.user.id),
    getUserEntitlement(session.user.id),
  ]);
  const devices = await listDevices(library.id);
  const billing = getPublicBillingPlans();
  const periodEnd = entitlement.currentPeriodEnd
    ? new Date(entitlement.currentPeriodEnd).toLocaleDateString()
    : null;

  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
        <section className="max-w-2xl space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Typefolio</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Account
          </h1>
          <p className="text-base text-muted-foreground">
            {session.user.name ? `${session.user.name} · ` : null}
            {session.user.email}
          </p>
        </section>

        {checkout === "success" ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
            Checkout completed. Your plan updates after the payment is confirmed.
          </div>
        ) : null}

        <UsageSummary entitlement={entitlement} showAccountLink={false} />

        <section className="space-y-2 text-sm text-muted-foreground">
          <p>Status: {formatStatus(entitlement.status)}</p>
          {periodEnd ? <p>Current period ends {periodEnd}</p> : null}
          {entitlement.isLaunchPricing ? (
            <p>Launch pricing is locked in for this subscription.</p>
          ) : null}
        </section>

        <BillingPanel billing={billing} isPro={entitlement.plan === "pro"} />

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Devices</h2>
          <DeviceList libraryId={library.id} devices={devices} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Delete account</h2>
          <p className="text-sm text-muted-foreground">
            This removes your sign-in and the fonts stored with this account.
          </p>
          <DeleteAccountButton />
        </section>
      </main>
    </div>
  );
}
