"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError, startBillingPortal, startCheckout } from "@typefolio/core/api";
import type { BillingPlansResponse, CheckoutPriceId } from "@typefolio/core/types";

interface BillingPanelProps {
  billing: BillingPlansResponse;
  isPro: boolean;
}

function formatGbp(amount: number): string {
  if (Number.isInteger(amount)) {
    return `£${amount}`;
  }

  return `£${amount.toFixed(2)}`;
}

function intervalLabel(interval: "year" | "month" | null): string {
  if (interval === "year") {
    return "/year";
  }
  if (interval === "month") {
    return "/month";
  }
  return "";
}

export function BillingPanel({ billing, isPro }: BillingPanelProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showPortal, setShowPortal] = useState(isPro);
  const plans = billing.plans.filter(
    (plan) => plan.checkoutPriceId && plan.available !== false,
  );

  async function openPortal() {
    setBusyId("portal");
    try {
      const { portalUrl } = await startBillingPortal();
      window.location.assign(portalUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Billing provider unavailable.";
      toast.error(message);
      setBusyId(null);
    }
  }

  async function checkout(priceId: CheckoutPriceId) {
    setBusyId(priceId);
    try {
      const { checkoutUrl } = await startCheckout(priceId);
      window.location.assign(checkoutUrl);
    } catch (error) {
      if (error instanceof ApiError && error.code === "ALREADY_SUBSCRIBED") {
        setShowPortal(true);
        toast.message("You already have Pro. Manage billing instead.");
      } else {
        const message =
          error instanceof Error ? error.message : "Billing provider unavailable.";
        toast.error(message);
      }
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-medium">Billing</h2>
        {billing.launchOffer.active ? (
          <p className="text-sm text-muted-foreground">{billing.launchOffer.message}</p>
        ) : null}
      </div>

      {showPortal ? (
        <Card>
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>
              Change your payment method, switch plans, or cancel in the billing portal.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              type="button"
              disabled={busyId !== null}
              onClick={() => void openPortal()}
            >
              {busyId === "portal" ? "Opening portal…" : "Manage billing"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.highlight ? "ring-2 ring-primary" : undefined}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.badge ? <Badge>{plan.badge}</Badge> : null}
                </div>
                <CardDescription>
                  {formatGbp(plan.priceGbp)}
                  {intervalLabel(plan.interval)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  type="button"
                  className="w-full"
                  disabled={busyId !== null || !plan.checkoutPriceId}
                  onClick={() => {
                    if (plan.checkoutPriceId) {
                      void checkout(plan.checkoutPriceId);
                    }
                  }}
                >
                  {busyId === plan.checkoutPriceId ? "Starting checkout…" : "Upgrade"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
