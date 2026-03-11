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
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { WorkspaceAvatar, WorkspaceAvatarFallback } from "@/features/workspaces/workspace-avatar";
import { useRouter } from "@/i18n/navigation";

type InviteTokenState =
  | "loading"
  | "auth_required"
  | "success"
  | "already_member"
  | "blocked"
  | "email_mismatch"
  | "error";

type InviteTokenVisual = "avatar" | "loading" | "success" | "blocked" | "warning" | "error";

type InviteTokenTranslationValues = Record<string, string>;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showDevStateSwitcher = process.env.NODE_ENV !== "production";
  const viewModel = createInviteTokenViewModel(previewState, MOCK_INVITE_CONTEXT, isSubmitting);
  const shouldRedirectToWorkspace = previewState === "success" && !showDevStateSwitcher;

  useEffect(() => {
    if (!shouldRedirectToWorkspace) {
      return;
    }

    router.replace("/w/workspace/overview");
  }, [router, shouldRedirectToWorkspace]);

  return (
    <div className="w-full py-4 text-center">
      {showDevStateSwitcher && (
        <NativeSelect
          aria-label={t("dev.selectAriaLabel")}
          value={previewState}
          onChange={(event) => {
            setPreviewState(parseInviteTokenPreviewState(event.target.value));
            setIsSubmitting(false);
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
          <p className="text-muted-foreground mt-3 text-sm text-pretty">
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
          <Button
            type="button"
            size="lg"
            className="mt-6 w-full"
            disabled={viewModel.ctaDisabled}
            onClick={handlePrimaryActionClick}
          >
            {viewModel.ctaLoading && <Spinner />}
            {t.rich(viewModel.ctaLabelKey, {
              ...viewModel.ctaLabelValues,
              strong: (chunks) => <strong className="font-semibold text-current">{chunks}</strong>,
            })}
          </Button>
        )}
      </div>
    </div>
  );

  function handlePrimaryActionClick() {
    if (previewState !== "auth_required" || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    window.setTimeout(() => {
      setIsSubmitting(false);
    }, 1200);
  }
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
  inviteContext: InviteTokenMockContext,
  isSubmitting: boolean
): InviteTokenViewModel {
  const authRequiredViewModel = createAuthRequiredViewModel(inviteContext, isSubmitting);

  const stateViewModelMap: Record<InviteTokenState, InviteTokenViewModel> = {
    loading: {
      visual: "loading",
      titleKey: "states.loading.title",
      descriptionKey: "states.loading.description",
    },
    auth_required: authRequiredViewModel,
    success: {
      visual: "success",
      titleKey: "states.success.title",
      descriptionKey: "states.success.description",
      descriptionValues: {
        workspace: inviteContext.workspaceName,
      },
    },
    already_member: {
      visual: "avatar",
      titleKey: "states.already_member.title",
      titleValues: {
        workspace: inviteContext.workspaceName,
      },
      ctaLabelKey: "states.already_member.cta",
    },
    blocked: {
      visual: "blocked",
      titleKey: "states.blocked.title",
      descriptionKey: "states.blocked.description",
    },
    email_mismatch: {
      visual: "warning",
      titleKey: "states.email_mismatch.title",
      descriptionKey: "states.email_mismatch.description",
      secondaryDescriptionKey: "states.email_mismatch.secondary",
      secondaryDescriptionValues: {
        invitedEmail: inviteContext.invitedEmail,
        currentEmail: inviteContext.mismatchedEmail,
      },
      ctaLabelKey: "states.email_mismatch.cta",
    },
    error: {
      visual: "error",
      titleKey: "states.error.title",
      descriptionKey: "states.error.description",
    },
  };

  return stateViewModelMap[state];
}

function createAuthRequiredViewModel(
  inviteContext: InviteTokenMockContext,
  isSubmitting: boolean
): InviteTokenViewModel {
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
    ctaDisabled: isSubmitting,
    ctaLoading: isSubmitting,
  };
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
    <div className="text-muted-foreground flex size-10 items-center justify-center">
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
