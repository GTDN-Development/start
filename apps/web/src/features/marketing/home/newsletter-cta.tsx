import { NewsletterForm } from "@/features/marketing/newsletter/newsletter-form";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function NewsletterCta({ className, ...props }: React.ComponentProps<"div">) {
  const t = useTranslations("pages.home.newsletterCta");

  return (
    <div
      {...props}
      className={cn(
        "bg-muted flex flex-col gap-8 rounded-xl px-8 py-6 sm:px-12 sm:py-8 md:flex-row md:items-center md:gap-16",
        className
      )}
    >
      <div className="flex flex-1 flex-col gap-3">
        <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h2>
        <p className="text-muted-foreground sm:text-lg">{t("description")}</p>
      </div>

      <NewsletterForm className="md:flex-1" />
    </div>
  );
}
