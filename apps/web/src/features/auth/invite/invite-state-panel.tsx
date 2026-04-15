import type { ReactNode } from "react";
import {
  AuthHeroContent,
  AuthHeroDescription,
  AuthHeroTitle,
} from "@/features/auth/auth-page-shell";

type InviteStatePanelProps = {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
};

export function InviteStatePanel({ title, description, action }: InviteStatePanelProps) {
  return (
    <AuthHeroContent className="mx-auto flex w-full max-w-md flex-col justify-center">
      <AuthHeroTitle>{title}</AuthHeroTitle>
      <AuthHeroDescription render={<div />} className="space-y-3">
        {description}
      </AuthHeroDescription>
      {action && <div className="pt-3">{action}</div>}
    </AuthHeroContent>
  );
}
