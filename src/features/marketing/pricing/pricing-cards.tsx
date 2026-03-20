"use client";

import { useState } from "react";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import { type PlanKey, plans } from "./pricing-config";

function PricingCard({
  planKey,
  highlighted,
  hasBillingToggle,
  featureKeys,
  ctaHref,
  isAnnual,
  onToggleBilling,
  className,
  ...props
}: {
  planKey: PlanKey;
  highlighted: boolean;
  hasBillingToggle: boolean;
  featureKeys: string[];
  ctaHref: string;
  isAnnual: boolean;
  onToggleBilling: () => void;
} & React.ComponentProps<typeof Card>) {
  const t = useTranslations("pages.pricing");
  const price = isAnnual ? t(`plans.${planKey}.yearlyPrice`) : t(`plans.${planKey}.monthlyPrice`);
  const period = t("billing.monthly").toLowerCase();

  return (
    <Card
      className={cn(
        "rounded-xl",
        highlighted && "ring-primary relative z-10 ring-2 xl:-my-4",
        className
      )}
      {...props}
    >
      <CardContent className={cn("flex h-full flex-col gap-7 px-6 py-5", highlighted && "lg:py-9")}>
        <div className="space-y-2">
          <h3 className="text-foreground font-heading font-semibold">
            {t(`plans.${planKey}.name`)}
          </h3>
          <div className="text-muted-foreground text-lg font-medium">
            {price}{" "}
            {hasBillingToggle && (
              <span className="text-muted-foreground">{t("billing.perUser", { period })}</span>
            )}
          </div>
        </div>

        {hasBillingToggle && (
          <div className="flex items-center gap-2">
            <Switch
              checked={isAnnual}
              onCheckedChange={onToggleBilling}
              aria-label={t("billing.toggleLabel")}
            />
            <span className="text-sm font-medium">{t("billing.annual")}</span>
          </div>
        )}

        <div className="flex-1 space-y-3">
          {featureKeys.map((featureKey) => (
            <div key={featureKey} className="text-muted-foreground flex items-center gap-1.5">
              <Check className="size-5 shrink-0" aria-hidden="true" />
              <span className="text-sm">{t(`plans.${planKey}.features.${featureKey}`)}</span>
            </div>
          ))}
        </div>

        <Button
          className="mt-auto w-fit"
          variant={highlighted ? "default" : "outline"}
          nativeButton={false}
          render={<a href={ctaHref}>{t(`plans.${planKey}.ctaText`)}</a>}
        />
      </CardContent>
    </Card>
  );
}

export function PricingCards({ className, ...props }: React.ComponentProps<"section">) {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section className={cn("py-28 lg:py-24", className)} {...props}>
      <div className="container max-w-6xl">
        <div className="grid gap-4 text-start md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <PricingCard
              key={plan.key}
              planKey={plan.key}
              highlighted={plan.highlighted}
              hasBillingToggle={plan.hasBillingToggle}
              featureKeys={plan.featureKeys}
              ctaHref={plan.ctaHref}
              isAnnual={isAnnual}
              onToggleBilling={() => setIsAnnual(!isAnnual)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
