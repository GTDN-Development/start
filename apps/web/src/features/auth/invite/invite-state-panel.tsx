import type { ReactNode } from "react";

type InviteStatePanelProps = {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
};

export function InviteStatePanel({ title, description, action }: InviteStatePanelProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center py-8 text-center">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="text-muted-foreground mt-3 space-y-3 text-sm">{description}</div>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
