import type { Metadata } from "next";
import Image from "next/image";
import { DownloadIcon } from "lucide-react";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { BRAND_PATH } from "@/config/routes";
import { createPublicPageMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";
import {
  brandAssetFormatLabels,
  brandAssetsConfig,
  brandColorFormatLabels,
  type BrandAsset,
} from "@/features/marketing/brand/brand-assets-config";
import { BrandCopyValueButton } from "@/features/marketing/brand/brand-copy-value-button";

const assetPreviewClassNames = {
  wide: "h-auto max-h-24 w-full",
  portrait: "h-full max-h-40 w-auto",
  square: "size-28",
} as const satisfies Record<BrandAsset["previewShape"], string>;

export async function generateMetadata(props: PageProps<"/[locale]/brand">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.brand",
  });

  return createPublicPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: BRAND_PATH,
  });
}

export default async function Page({ params }: PageProps<"/[locale]/brand">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.brand",
  });

  return (
    <div className="relative">
      <Hero>
        <HeroContent size="md">
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("description")}</HeroDescription>
        </HeroContent>
      </Hero>

      <div className="flex flex-col gap-24 pb-24">
        <Container render={<section aria-labelledby="brand-colors-title" />}>
          <SectionHeader
            id="brand-colors-title"
            title={t("colors.title")}
            description={t("colors.description")}
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {brandAssetsConfig.colors.map((color) => (
              <Card key={color.id} size="sm">
                <CardHeader>
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      aria-hidden="true"
                      className="border-border size-14 shrink-0 rounded-lg border shadow-xs"
                      style={{ backgroundColor: color.preview }}
                    />
                    <div className="min-w-0">
                      <CardTitle>{t(`colors.items.${color.id}.title`)}</CardTitle>
                      <CardDescription>{t(`colors.items.${color.id}.description`)}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {color.values.map((item) => (
                    <BrandCopyValueButton
                      key={item.format}
                      format={brandColorFormatLabels[item.format]}
                      value={item.value}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>

        <Container render={<section aria-labelledby="brand-assets-title" />}>
          <SectionHeader
            id="brand-assets-title"
            title={t("assets.title")}
            description={t("assets.description")}
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {brandAssetsConfig.assets.map((asset) => {
              const assetTitle = t(`assets.items.${asset.id}.title`);

              return (
                <Card key={asset.id}>
                  <CardHeader>
                    <CardTitle>{assetTitle}</CardTitle>
                    <CardDescription>{t(`assets.items.${asset.id}.description`)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 border-border flex aspect-[4/3] items-center justify-center rounded-lg border p-8">
                      <Image
                        src={asset.previewSrc}
                        alt={assetTitle}
                        width={asset.previewWidth}
                        height={asset.previewHeight}
                        loading="eager"
                        unoptimized
                        className={cn(
                          "max-w-full object-contain",
                          assetPreviewClassNames[asset.previewShape]
                        )}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
                    {asset.downloads.map((download) => {
                      const formatLabel = brandAssetFormatLabels[download.format];

                      return (
                        <Button
                          key={download.format}
                          variant="outline"
                          size="sm"
                          nativeButton={false}
                          render={
                            <a
                              href={download.href}
                              download={download.fileName}
                              aria-label={t("assets.downloadAriaLabel", {
                                asset: assetTitle,
                                format: formatLabel,
                              })}
                            />
                          }
                        >
                          <DownloadIcon aria-hidden="true" data-icon="inline-start" />
                          {formatLabel}
                        </Button>
                      );
                    })}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </Container>
      </div>
    </div>
  );
}

function SectionHeader({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <h2 id={id} className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <p className="text-muted-foreground text-base text-pretty">{description}</p>
    </div>
  );
}
