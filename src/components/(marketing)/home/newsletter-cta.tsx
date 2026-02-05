import { NewsletterForm } from "./newsletter-form";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export function NewsletterCta(props: React.ComponentProps<typeof Card>) {
  const t = useTranslations("pages.home.newsletterCta");

  return (
    <Card {...props}>
      <CardContent className="grid gap-7 md:grid-cols-2">
        <div className="flex flex-col items-start justify-center gap-6">
          <h2 className="text-2xl font-bold sm:text-3xl">{t("title")}</h2>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <div className="relative z-10">
          <NewsletterForm />
        </div>
      </CardContent>
    </Card>
  );
}
