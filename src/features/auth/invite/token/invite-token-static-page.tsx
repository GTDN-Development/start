"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleXIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import {
  WorkspaceAvatar,
  WorkspaceAvatarFallback,
} from "@/features/application/new/workspace-avatar";
import { useRouter } from "@/i18n/navigation";

type InviteTokenState =
  | "loading"
  | "auth_required"
  | "accepting"
  | "success"
  | "already_member"
  | "blocked"
  | "email_mismatch"
  | "error";

type InviteTokenVisual = "avatar" | "loading" | "success" | "blocked" | "warning" | "error";

type InviteTokenTranslationValues = Record<string, string>;

type InviteTokenAlert = {
  variant?: "default" | "destructive";
  titleKey: string;
  descriptionKey: string;
  descriptionValues?: InviteTokenTranslationValues;
};

type InviteTokenViewModel = {
  visual: InviteTokenVisual;
  titleKey: string;
  titleValues?: InviteTokenTranslationValues;
  descriptionKey?: string;
  descriptionValues?: InviteTokenTranslationValues;
  secondaryDescriptionKey?: string;
  secondaryDescriptionValues?: InviteTokenTranslationValues;
  ctaLabelKey?: string;
  ctaLabelValues?: InviteTokenTranslationValues;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  alert?: InviteTokenAlert;
};

type InviteTokenMockContext = {
  workspaceName: string;
  workspaceInitials: string;
  invitedByName: string;
  invitedEmail: string;
  currentEmail: string;
  mismatchedEmail: string;
};

const DEV_PREVIEW_OPTIONS = [
  "loading",
  "auth_required",
  "accepting",
  "success",
  "already_member",
  "blocked",
  "email_mismatch",
  "error",
] as const;

type InviteTokenPreviewState = (typeof DEV_PREVIEW_OPTIONS)[number];

const MOCK_INVITE_CONTEXT: InviteTokenMockContext = {
  workspaceName: "Acme Product Team",
  workspaceInitials: "AP",
  invitedByName: "Fanda Blazek",
  invitedEmail: "anna.novak@acme.test",
  currentEmail: "anna.novak@acme.test",
  mismatchedEmail: "petr.svoboda@acme.test",
};

export function InviteTokenStaticPage() {
  const t = useTranslations("pages.inviteToken");
  const router = useRouter();
  const [previewState, setPreviewState] = useState<InviteTokenPreviewState>("auth_required");
  const showDevStateSwitcher = process.env.NODE_ENV !== "production";
  const viewModel = createInviteTokenViewModel(previewState, MOCK_INVITE_CONTEXT);
  const shouldRedirectToWorkspace = previewState === "success" && !showDevStateSwitcher;

  useEffect(() => {
    if (!shouldRedirectToWorkspace) {
      return;
    }

    router.replace("/w/workspace/overview");
  }, [router, shouldRedirectToWorkspace]);

  return (
    <div className="w-full text-center">
      {showDevStateSwitcher && (
        <NativeSelect
          aria-label={t("dev.selectAriaLabel")}
          value={previewState}
          onChange={(event) => {
            setPreviewState(parseInviteTokenPreviewState(event.target.value));
          }}
          className="mx-auto"
        >
          {DEV_PREVIEW_OPTIONS.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {t(`dev.options.${option}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      )}

      <div className={showDevStateSwitcher ? "mt-6" : undefined}>
        <div className="flex justify-center">
          <InviteTokenVisual
            visual={viewModel.visual}
            workspaceName={MOCK_INVITE_CONTEXT.workspaceName}
            workspaceInitials={MOCK_INVITE_CONTEXT.workspaceInitials}
          />
        </div>

        <h1 className="mt-6 text-lg/[1.2] font-medium tracking-tight text-pretty sm:text-xl/[1.2]">
          {t.rich(viewModel.titleKey, {
            ...viewModel.titleValues,
            strong: (chunks) => <strong className="text-foreground font-bold">{chunks}</strong>,
          })}
        </h1>
        {viewModel.descriptionKey && (
          <p className="text-muted-foreground mt-3 text-sm text-pretty sm:text-base">
            {t.rich(viewModel.descriptionKey, {
              ...viewModel.descriptionValues,
              strong: (chunks) => (
                <strong className="text-foreground font-semibold">{chunks}</strong>
              ),
            })}
          </p>
        )}
        {viewModel.secondaryDescriptionKey && (
          <p className="text-muted-foreground mt-2 text-sm text-pretty">
            {t.rich(viewModel.secondaryDescriptionKey, {
              ...viewModel.secondaryDescriptionValues,
              strong: (chunks) => (
                <strong className="text-foreground font-semibold">{chunks}</strong>
              ),
            })}
          </p>
        )}

        {viewModel.ctaLabelKey && (
          <Button type="button" size="lg" className="mt-6 w-full" disabled={viewModel.ctaDisabled}>
            {viewModel.ctaLoading && <Spinner />}
            {t.rich(viewModel.ctaLabelKey, {
              ...viewModel.ctaLabelValues,
              strong: (chunks) => <strong className="font-semibold text-current">{chunks}</strong>,
            })}
          </Button>
        )}

        {viewModel.alert && (
          <Alert variant={viewModel.alert.variant} className="mt-4 text-left">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>{t(viewModel.alert.titleKey)}</AlertTitle>
            <AlertDescription>
              {t.rich(viewModel.alert.descriptionKey, {
                ...viewModel.alert.descriptionValues,
                strong: (chunks) => (
                  <strong className="text-foreground font-semibold">{chunks}</strong>
                ),
              })}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

function parseInviteTokenPreviewState(value: string): InviteTokenPreviewState {
  if (isInviteTokenPreviewState(value)) {
    return value;
  }

  return "auth_required";
}

function isInviteTokenPreviewState(value: string): value is InviteTokenPreviewState {
  return DEV_PREVIEW_OPTIONS.includes(value as InviteTokenPreviewState);
}

function createInviteTokenViewModel(
  state: InviteTokenState,
  inviteContext: InviteTokenMockContext
): InviteTokenViewModel {
  switch (state) {
    case "loading":
      return {
        visual: "loading",
        titleKey: "states.loading.title",
        descriptionKey: "states.loading.description",
      };
    case "auth_required":
      return {
        visual: "avatar",
        titleKey: "states.auth_required.title",
        descriptionKey: "states.auth_required.description",
        descriptionValues: {
          workspace: inviteContext.workspaceName,
        },
        secondaryDescriptionKey: "states.auth_required.invitedBy",
        secondaryDescriptionValues: {
          inviter: inviteContext.invitedByName,
        },
        ctaLabelKey: "shared.continueAs",
        ctaLabelValues: {
          email: inviteContext.currentEmail,
        },
      };
    case "accepting":
      return {
        visual: "avatar",
        titleKey: "states.auth_required.title",
        descriptionKey: "states.auth_required.description",
        descriptionValues: {
          workspace: inviteContext.workspaceName,
        },
        secondaryDescriptionKey: "states.auth_required.invitedBy",
        secondaryDescriptionValues: {
          inviter: inviteContext.invitedByName,
        },
        ctaLabelKey: "shared.continueAs",
        ctaLabelValues: {
          email: inviteContext.currentEmail,
        },
        ctaDisabled: true,
        ctaLoading: true,
      };
    case "success":
      return {
        visual: "success",
        titleKey: "states.success.title",
        descriptionKey: "states.success.description",
        descriptionValues: {
          workspace: inviteContext.workspaceName,
        },
      };
    case "already_member":
      return {
        visual: "avatar",
        titleKey: "states.already_member.title",
        titleValues: {
          workspace: inviteContext.workspaceName,
        },
        ctaLabelKey: "states.already_member.cta",
      };
    case "blocked":
      return {
        visual: "blocked",
        titleKey: "states.blocked.title",
        descriptionKey: "states.blocked.description",
        ctaLabelKey: "states.blocked.cta",
        alert: {
          titleKey: "states.blocked.alert.title",
          descriptionKey: "states.blocked.alert.description",
        },
      };
    case "email_mismatch":
      return {
        visual: "warning",
        titleKey: "states.email_mismatch.title",
        descriptionKey: "states.email_mismatch.description",
        ctaLabelKey: "states.email_mismatch.cta",
        alert: {
          titleKey: "states.email_mismatch.alert.title",
          descriptionKey: "states.email_mismatch.alert.description",
          descriptionValues: {
            invitedEmail: inviteContext.invitedEmail,
            currentEmail: inviteContext.mismatchedEmail,
          },
        },
      };
    case "error":
      return {
        visual: "error",
        titleKey: "states.error.title",
        descriptionKey: "states.error.description",
        ctaLabelKey: "states.error.cta",
        alert: {
          variant: "destructive",
          titleKey: "states.error.alert.title",
          descriptionKey: "states.error.alert.description",
        },
      };
  }
}

function InviteTokenVisual({
  visual,
  workspaceName,
  workspaceInitials,
}: {
  visual: InviteTokenVisual;
  workspaceName: string;
  workspaceInitials: string;
}) {
  if (visual === "avatar") {
    return (
      <WorkspaceAvatar size="lg" aria-label={workspaceName} title={workspaceName}>
        <WorkspaceAvatarFallback>{workspaceInitials}</WorkspaceAvatarFallback>
      </WorkspaceAvatar>
    );
  }

  return (
    <div className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-full">
      {visual === "loading" && (
        <LoaderCircleIcon aria-hidden="true" className="size-8 animate-spin" />
      )}
      {visual === "success" && (
        <CircleCheckIcon aria-hidden="true" className="size-8 text-emerald-600" />
      )}
      {visual === "blocked" && (
        <CircleXIcon aria-hidden="true" className="text-destructive size-8" />
      )}
      {visual === "warning" && (
        <TriangleAlertIcon aria-hidden="true" className="size-8 text-amber-600" />
      )}
      {visual === "error" && (
        <CircleAlertIcon aria-hidden="true" className="text-destructive size-8" />
      )}
    </div>
  );
}
