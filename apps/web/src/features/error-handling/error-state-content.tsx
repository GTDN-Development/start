import { TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { type AppHref } from "@/i18n/navigation";
import {
  Problem,
  ProblemActions,
  ProblemDescription,
  ProblemHeader,
  ProblemMedia,
  ProblemTitle,
} from "@/components/ui/problem";

type ErrorStateContentProps = {
  className?: string;
  error?: Error & { digest?: string };
  href?: AppHref;
  hrefLabel?: string;
  reset?: () => void;
};

export function ErrorStateContent({
  className,
  error,
  href,
  hrefLabel,
  reset,
}: ErrorStateContentProps) {
  const t = useTranslations("common.error");

  return (
    <Problem className={className}>
      <ProblemHeader>
        <ProblemMedia>
          <TriangleAlertIcon aria-hidden="true" />
        </ProblemMedia>
        <ProblemTitle>{t("title")}</ProblemTitle>
        <ProblemDescription>{t("description")}</ProblemDescription>
        {error?.digest ? (
          <ProblemDescription>{t("reference", { reference: error.digest })}</ProblemDescription>
        ) : null}
      </ProblemHeader>

      {reset || (href && hrefLabel) ? (
        <ProblemActions>
          {reset ? (
            <Button size="lg" type="button" variant="destructive" onClick={reset}>
              {t("retry")}
            </Button>
          ) : null}
          {href && hrefLabel ? (
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href={href} />}>
              {hrefLabel}
            </Button>
          ) : null}
        </ProblemActions>
      ) : null}
    </Problem>
  );
}
