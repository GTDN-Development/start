// Note that `app/[locale]/[...rest]/page.tsx`
// is necessary for this page to render.

import { Button } from "@/components/ui/button";
import { Hero, HeroContent, HeroTitle, HeroDescription, HeroActions } from "@/components/ui/hero";
import { HomeIcon } from "lucide-react";
import { Link } from "@/components/ui/link";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("common.notFound");

  return (
    <Hero>
      <HeroContent className="text-center">
        <div className="text-primary font-medium">{t("code")}</div>
        <HeroTitle>{t("title")}</HeroTitle>
        <HeroDescription>{t("description")}</HeroDescription>
        <HeroActions>
          <Button size="lg" render={<Link href="/" />}>
            <HomeIcon aria-hidden="true" />
            {t("goHome")}
          </Button>
        </HeroActions>
      </HeroContent>
    </Hero>
  );
}
