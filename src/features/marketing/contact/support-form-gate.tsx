import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { SIGN_IN_PATH } from "@/config/routes";
import { getServerAuthSession } from "@/server/auth/auth-session-service";
import { SupportForm } from "./support-form";

type SupportFormGateProps = {
  locale: Locale;
};

export async function SupportFormGate({ locale }: SupportFormGateProps) {
  const [tSupportForm, sessionResponse] = await Promise.all([
    getTranslations({
      locale,
      namespace: "forms.support",
    }),
    getServerAuthSession(),
  ]);
  const isAuthenticated = sessionResponse.ok && Boolean(sessionResponse.data.session);

  if (isAuthenticated) {
    return <SupportForm />;
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className="flex flex-col gap-2">
        <p className="font-heading text-lg font-semibold tracking-tight">
          {tSupportForm("loginGate.title")}
        </p>
        <p className="text-muted-foreground text-sm">{tSupportForm("loginGate.description")}</p>
      </div>
      <Button nativeButton={false} render={<Link href={SIGN_IN_PATH} />} className="w-fit">
        {tSupportForm("loginGate.button")}
      </Button>
    </div>
  );
}
