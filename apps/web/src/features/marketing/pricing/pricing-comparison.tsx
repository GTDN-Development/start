"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
  type ComparisonFeatureRow,
  type ComparisonSection,
  type PlanKey,
  comparisonSections,
  planKeys,
  plans,
} from "./pricing-config";

type FeatureValue = true | null | string;

const highlightedIndex = plans.findIndex((p) => p.highlighted);

function getCellValue(
  section: ComparisonSection,
  feature: ComparisonFeatureRow,
  planKey: PlanKey,
  t: ReturnType<typeof useTranslations<"pages.pricing">>
): FeatureValue {
  if ("stringValues" in feature) {
    return t(`comparison.sections.${section.key}.features.${feature.key}.${planKey}`);
  }
  return feature.values[planKey];
}

function FeatureValueCell({ value, highlighted }: { value: FeatureValue; highlighted?: boolean }) {
  if (value === true) {
    return (
      <span
        className={cn(
          "inline-flex size-6 items-center justify-center rounded-full",
          highlighted ? "bg-foreground" : "bg-foreground/10"
        )}
      >
        <Check
          className={cn("size-3.5", highlighted ? "text-background" : "text-foreground")}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </span>
    );
  }
  if (value === null) {
    return <Minus className="text-border size-4" strokeWidth={2} aria-hidden="true" />;
  }
  return (
    <span className={cn("text-sm", highlighted ? "text-foreground" : "text-muted-foreground")}>
      {value}
    </span>
  );
}

function ComparisonRow({
  section,
  feature,
  isLast,
  t,
}: {
  section: ComparisonSection;
  feature: ComparisonFeatureRow;
  isLast: boolean;
  t: ReturnType<typeof useTranslations<"pages.pricing">>;
}) {
  const featureName = t(`comparison.sections.${section.key}.features.${feature.key}.name`);

  return (
    <div className="grid grid-cols-5">
      <span
        className={cn(
          "border-border inline-flex items-center border-t py-3.5 pr-4 text-sm",
          isLast && "border-b"
        )}
      >
        {featureName}
      </span>
      {planKeys.map((planKey, i) => (
        <Tooltip key={planKey}>
          <TooltipTrigger
            render={
              <div
                className={cn(
                  "border-border flex items-center justify-center border-t px-2 py-3.5",
                  isLast && "border-b",
                  i === highlightedIndex && "bg-foreground/4 border-x px-4"
                )}
              />
            }
          >
            <FeatureValueCell
              value={getCellValue(section, feature, planKey, t)}
              highlighted={i === highlightedIndex}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{featureName}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function MobileComparison({
  t,
  className,
  ...props
}: { t: ReturnType<typeof useTranslations<"pages.pricing">> } & React.ComponentProps<"div">) {
  const [selectedPlan, setSelectedPlan] = useState(1);
  const [open, setOpen] = useState(false);
  const selectedPlanKey = planKeys[selectedPlan];
  const isHighlighted = selectedPlan === highlightedIndex;

  return (
    <div className={className} {...props}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between border-b py-4">
          <CollapsibleTrigger className="flex items-center gap-2">
            <h3 className="font-heading text-2xl font-semibold">
              {t(`plans.${selectedPlanKey}.name`)}
            </h3>
            <ChevronsUpDown
              className={cn("size-5 transition-transform", open && "rotate-180")}
              aria-hidden="true"
            />
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="flex flex-col space-y-2 p-2">
          {planKeys.map(
            (planKey, index) =>
              index !== selectedPlan && (
                <Button
                  key={planKey}
                  size="lg"
                  variant="secondary"
                  onClick={() => {
                    setSelectedPlan(index);
                    setOpen(false);
                  }}
                >
                  {t(`plans.${planKey}.name`)}
                </Button>
              )
          )}
        </CollapsibleContent>
      </Collapsible>

      {comparisonSections.map((section) => (
        <div key={section.key}>
          <div className="border-b pt-8 pb-4">
            <span className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
              {t(`comparison.sections.${section.key}.title`)}
            </span>
          </div>
          {section.features.map((feature) => (
            <div
              key={feature.key}
              className="text-foreground grid grid-cols-2 border-b font-medium"
            >
              <span className="inline-flex items-center py-3.5 text-sm">
                {t(`comparison.sections.${section.key}.features.${feature.key}.name`)}
              </span>
              <div className="flex items-center justify-center py-3.5">
                <FeatureValueCell
                  value={getCellValue(section, feature, selectedPlanKey, t)}
                  highlighted={isHighlighted}
                />
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="mt-8">
        <Button
          className="w-full"
          variant={isHighlighted ? "default" : "outline"}
          nativeButton={false}
          render={<a href="#">{t(`plans.${selectedPlanKey}.ctaText`)}</a>}
        />
      </div>
    </div>
  );
}

function DesktopComparison({
  t,
  className,
  ...props
}: { t: ReturnType<typeof useTranslations<"pages.pricing">> } & React.ComponentProps<"div">) {
  return (
    <div className={className} {...props}>
      <div className="grid grid-cols-5">
        <div className="pt-5 pb-6" />
        {planKeys.map((planKey, i) => (
          <div
            key={planKey}
            className={cn(
              "pt-5 pb-6 text-center",
              i === highlightedIndex &&
                "border-border bg-foreground/4 rounded-t-2xl border border-b-0 px-4"
            )}
          >
            <p className="font-heading text-base font-medium">{t(`plans.${planKey}.name`)}</p>
          </div>
        ))}
      </div>

      {comparisonSections.map((section) => (
        <div key={section.key}>
          {section.showTitle && (
            <div className="pt-8 pb-3">
              <span className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                {t(`comparison.sections.${section.key}.title`)}
              </span>
            </div>
          )}

          {section.features.map((feature, featureIndex) => (
            <ComparisonRow
              key={feature.key}
              section={section}
              feature={feature}
              isLast={featureIndex === section.features.length - 1}
              t={t}
            />
          ))}
        </div>
      ))}

      <div className="grid grid-cols-5">
        <div className="pt-8 pb-4" />
        {planKeys.map((planKey, i) => (
          <div
            key={planKey}
            className={cn(
              "px-2 pt-8 pb-4 text-center",
              i === highlightedIndex &&
                "border-border bg-foreground/4 rounded-b-2xl border-x border-b px-4"
            )}
          >
            <Button
              variant={i === highlightedIndex ? "default" : "outline"}
              className="w-full"
              nativeButton={false}
              render={<a href="#">{t(`plans.${planKey}.ctaText`)}</a>}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PricingComparison({ className }: { className?: string }) {
  const t = useTranslations("pages.pricing");

  return (
    <section className={cn("pb-28 lg:py-32", className)}>
      <div className="container max-w-6xl">
        <MobileComparison t={t} className="md:hidden" />
        <DesktopComparison t={t} className="max-md:hidden" />
      </div>
    </section>
  );
}
