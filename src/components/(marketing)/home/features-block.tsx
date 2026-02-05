import {
  LayoutIcon,
  SettingsIcon,
  SearchIcon,
  CookieIcon,
  ShieldIcon,
  MessageSquareIcon,
  PaletteIcon,
  SparklesIcon,
  CheckIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type FeatureDefinition = {
  id: string;
  icon: React.ComponentType<React.ComponentProps<"svg">>;
};

const featureDefinitions: FeatureDefinition[] = [
  { id: "responsiveLayout", icon: LayoutIcon },
  { id: "unifiedConfiguration", icon: SettingsIcon },
  { id: "seoFoundation", icon: SearchIcon },
  { id: "gdprConsent", icon: CookieIcon },
  { id: "privacyPolicy", icon: ShieldIcon },
  { id: "contactForm", icon: MessageSquareIcon },
  { id: "themeManagement", icon: PaletteIcon },
  { id: "heroSystem", icon: SparklesIcon },
];

function getFeatureItems(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function FeaturesBlock(props: React.ComponentProps<"div">) {
  const t = useTranslations("pages.home.features");

  return (
    <div {...props}>
      <h2 className="text-2xl font-semibold sm:text-3xl">{t("title")}</h2>
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {featureDefinitions.map((feature) => {
          const Icon = feature.icon;
          const featureItems = getFeatureItems(t.raw(`items.${feature.id}.points`));

          return (
            <div key={feature.id} className="bg-muted rounded-xl p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-3">
                <Button size="icon-lg" variant="outline">
                  <div>
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                </Button>
                <h3 className="text-foreground text-base font-medium">
                  {t(`items.${feature.id}.title`)}
                </h3>
              </div>

              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                {t(`items.${feature.id}.description`)}
              </p>

              {featureItems.length > 0 && (
                <ul className="space-y-3">
                  {featureItems.map((featureItem) => (
                    <li key={featureItem} className="flex items-center gap-3">
                      <div className="bg-muted-foreground/20 flex size-4 items-center justify-center rounded-full">
                        <CheckIcon className="text-muted-foreground size-2.5" aria-hidden="true" />
                      </div>
                      <span className="text-foreground text-sm">{featureItem}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
