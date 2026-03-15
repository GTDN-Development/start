"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { Spinner } from "@/components/ui/spinner";
import { setPendingInviteHashAction } from "@/features/workspaces/actions/workspace-actions";

export function InviteTokenAuthRequiredRedirect({
  inviteHash,
  title,
  description,
  actionLabel,
}: {
  inviteHash: string;
  title: string;
  description: string;
  actionLabel: string;
}) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    Promise.resolve()
      .then(async () => {
        const result = await setPendingInviteHashAction({
          inviteHash,
        });

        if (isCancelled) {
          return;
        }

        if (!result.ok) {
          Promise.resolve().then(() => setIsRedirecting(false));
          return;
        }

        router.replace("/sign-in");
      })
      .catch(() => {
        if (!isCancelled) {
          Promise.resolve().then(() => setIsRedirecting(false));
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [inviteHash, router]);

  return (
    <div className="mx-auto flex min-h-[40vh] w-full max-w-md flex-col justify-center py-8 text-center">
      {isRedirecting && (
        <div className="mx-auto">
          <Spinner />
        </div>
      )}
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-3 text-sm">{description}</p>
      <Button
        size="lg"
        nativeButton={false}
        className="mt-6 w-full"
        render={<Link href="/sign-in" className="w-full" />}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
