import { redirect } from "next/navigation";

import { PlanPicker } from "@/components/plan-picker";
import { getBillingPlans, getMe } from "@/lib/api-server";
import { formatWhen } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const me = await getMe();
  if (!me) {
    redirect("/auth/sign-in?next=/plan");
  }

  const billing = await getBillingPlans();
  const pro =
    me.entitlement.plan === "pro" &&
    (me.entitlement.status === "active" ||
      me.entitlement.status === "trialing" ||
      me.entitlement.status === "past_due");

  return (
    <main className="flex flex-1 flex-col gap-8">
      <header className="max-w-prose space-y-2">
        <h1 className="text-[1.75rem] font-semibold">Plan</h1>
        <p className="text-muted-foreground">
          {pro
            ? `Pro is on${me.entitlement.isLaunchPricing ? " at launch pricing" : ""}${
                me.entitlement.currentPeriodEnd
                  ? ` through ${formatWhen(me.entitlement.currentPeriodEnd)}`
                  : ""
              }.`
            : "Free includes the web library. Pro turns on sync."}
        </p>
      </header>
      <PlanPicker
        plans={billing.plans}
        launchMessage={billing.launchOffer.active ? billing.launchOffer.message : null}
        isPro={pro}
      />
    </main>
  );
}
