"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ApiError, clientApi } from "@/lib/api";
import { formatGbp } from "@/lib/format";
import { API_ERROR_CODES } from "@/lib/types";
import type { BillingPlanPublic, CheckoutPriceId } from "@/lib/types";

interface PlanPickerProps {
  plans: BillingPlanPublic[];
  launchMessage: string | null;
  isPro: boolean;
}

export function PlanPicker({ plans, launchMessage, isPro }: PlanPickerProps) {
  const [pending, setPending] = useState<string | null>(null);

  async function openPortal() {
    setPending("portal");
    try {
      const result = await clientApi<{ portalUrl: string }>("/api/billing/portal", {
        method: "POST",
      });
      window.location.assign(result.portalUrl);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Billing portal is unavailable.",
      );
      setPending(null);
    }
  }

  async function checkout(priceId: CheckoutPriceId) {
    setPending(priceId);
    try {
      const result = await clientApi<{ checkoutUrl: string }>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId }),
      });
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      if (error instanceof ApiError && error.code === API_ERROR_CODES.alreadySubscribed) {
        await openPortal();
        return;
      }
      toast.error(error instanceof Error ? error.message : "Checkout is unavailable.");
      setPending(null);
    }
  }

  return (
    <div className="space-y-8">
      {launchMessage ? (
        <p className="max-w-prose text-sm font-medium">{launchMessage}</p>
      ) : null}

      {isPro ? (
        <div className="max-w-prose space-y-4">
          <p>Pro is active on this account. Manage the payment method or cancel from the billing portal.</p>
          <Button type="button" disabled={pending !== null} onClick={() => void openPortal()}>
            {pending === "portal" ? "Opening portal…" : "Manage billing"}
          </Button>
        </div>
      ) : null}

      <ul className="grid gap-4 lg:grid-cols-2">
        {plans
          .filter((plan) => plan.available !== false)
          .map((plan) => {
            const paid = Boolean(plan.checkoutPriceId);
            const emphasized = Boolean(plan.highlight && plan.checkoutPriceId);
            return (
              <li
                key={plan.id}
                className={`flex flex-col gap-4 rounded-lg border px-5 py-5 ${
                  emphasized ? "border-primary bg-card" : "border-border bg-card"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-lg font-medium">{plan.name}</h2>
                    {plan.badge ? (
                      <span className="text-xs font-medium text-primary">{plan.badge}</span>
                    ) : null}
                  </div>
                  <p className="tabular-nums">
                    <span className="text-2xl font-semibold tracking-tight">
                      {formatGbp(plan.priceGbp)}
                    </span>
                    {plan.interval ? (
                      <span className="text-sm text-muted-foreground"> / {plan.interval}</span>
                    ) : null}
                  </p>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {paid && plan.checkoutPriceId && !isPro ? (
                  <Button
                    type="button"
                    variant={emphasized ? "default" : "outline"}
                    disabled={pending !== null}
                    onClick={() => void checkout(plan.checkoutPriceId!)}
                  >
                    {pending === plan.checkoutPriceId ? "Opening checkout…" : `Choose ${plan.name}`}
                  </Button>
                ) : null}
              </li>
            );
          })}
      </ul>
    </div>
  );
}
