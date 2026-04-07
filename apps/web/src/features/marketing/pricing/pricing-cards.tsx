"use client";

import { useState } from "react";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import { plans } from "./pricing-config";

export function PricingCards({ className, ...props }: React.ComponentProps<"section">) {
  const [isAnnual, setIsAnnual] = useState(true);
  const t = useTranslations("pages.pricing");

  return (
    <section className={cn("py-28 lg:py-24", className)} {...props}>
      <div className="container max-w-6xl">
        <div className="grid gap-4 text-start md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={cn(
                "rounded-xl",
                plan.highlighted && "ring-primary relative z-10 ring-2 xl:-my-4"
              )}
            >
              <CardContent
                className={cn(
                  "flex h-full flex-col gap-7 px-6 py-5",
                  plan.highlighted && "lg:py-9"
                )}
              >
                <div className="space-y-2">
                  <h3 className="text-foreground font-heading font-semibold">
                    {t(`plans.${plan.key}.name`)}
                  </h3>
                  <div className="text-muted-foreground text-lg font-medium">
                    {isAnnual
                      ? t(`plans.${plan.key}.yearlyPrice`)
                      : t(`plans.${plan.key}.monthlyPrice`)}{" "}
                    {plan.hasBillingToggle && (
                      <span className="text-muted-foreground">
                        {t("billing.perUser", { period: t("billing.monthly").toLowerCase() })}
                      </span>
                    )}
                  </div>
                </div>

                {plan.hasBillingToggle && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isAnnual}
                      onCheckedChange={() => setIsAnnual(!isAnnual)}
                      aria-label={t("billing.toggleLabel")}
                    />
                    <span className="text-sm font-medium">{t("billing.annual")}</span>
                  </div>
                )}

                <div className="flex-1 space-y-3">
                  {plan.featureKeys.map((featureKey) => (
                    <div
                      key={featureKey}
                      className="text-muted-foreground flex items-center gap-1.5"
                    >
                      <Check className="size-5 shrink-0" aria-hidden="true" />
                      <span className="text-sm">
                        {t(`plans.${plan.key}.features.${featureKey}`)}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  className="mt-auto w-fit"
                  variant={plan.highlighted ? "default" : "outline"}
                  nativeButton={false}
                  render={<a href={plan.ctaHref}>{t(`plans.${plan.key}.ctaText`)}</a>}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
