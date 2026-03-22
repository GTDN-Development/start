"use client";

import { startTransition, useState } from "react";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { signOut } from "@/features/auth/auth-client";
import { type AppHref, useRouter } from "@/i18n/navigation";

type InviteSignOutButtonProps = {
  label: string;
  errorMessage: string;
  redirectHref: AppHref;
};

export function InviteSignOutButton({
  label,
  errorMessage,
  redirectHref,
}: InviteSignOutButtonProps) {
  const router = useRouter();

  const [isPending, setIsPending] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    if (isPending) {
      return;
    }

    setIsPending(true);
    setSubmitErrorMessage(null);

    const response = await signOut();

    if (response.ok) {
      startTransition(() => {
        router.replace(redirectHref);
      });
      return;
    }

    setIsPending(false);
    setSubmitErrorMessage(errorMessage);
  }

  return (
    <div>
      <Button type="button" size="lg" className="w-full" onClick={handleClick} disabled={isPending}>
        {isPending ? <Spinner /> : <LogOutIcon aria-hidden="true" className="size-4" />}
        {label}
      </Button>
      {submitErrorMessage && <p className="text-destructive mt-3 text-sm">{submitErrorMessage}</p>}
    </div>
  );
}
