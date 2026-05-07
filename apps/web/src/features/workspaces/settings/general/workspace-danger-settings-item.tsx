"use client";

import { useForm } from "@tanstack/react-form";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LogOutIcon, Trash2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { Spinner } from "@/components/ui/spinner";
import type { WorkspaceSettingsWorkspace } from "@/features/workspaces/settings/workspace-settings-types";
import { createWorkspaceConfirmationFormSchema } from "@/features/workspaces/workspace-schemas";
import type { WorkspaceResponse } from "@/server/workspaces/workspace-types";

type WorkspaceDangerSettingsItemProps = {
  kind: "leave" | "delete";
  workspace: WorkspaceSettingsWorkspace;
  onAction: () => Promise<WorkspaceResponse<{ left?: true; deleted?: true }>>;
};

type WorkspaceDangerFormValues = {
  confirmationUrl: string;
  isAcknowledged: boolean;
};

export function WorkspaceDangerSettingsItem({
  kind,
  workspace,
  onAction,
}: WorkspaceDangerSettingsItemProps) {
  const t = useTranslations(`pages.workspace.general.${kind}`);
  const tCommon = useTranslations("pages.workspace.common");
  const toastId = useId();
  const [isOpen, setIsOpen] = useState(false);

  const isBlocked =
    kind === "leave"
      ? workspace.role === "owner" && workspace.isCurrentUserLastOwner
      : workspace.role !== "owner";
  const Icon = kind === "leave" ? LogOutIcon : Trash2Icon;
  const confirmationSchema = createWorkspaceConfirmationFormSchema(workspace.slug, {
    confirmationRequired: t("validation.confirmationUrl.required"),
    confirmationMismatch: t("validation.confirmationUrl.mismatch", {
      workspaceSlug: workspace.slug,
    }),
    acknowledged: t("validation.acknowledged.required"),
  });

  const form = useForm({
    defaultValues: {
      confirmationUrl: "",
      isAcknowledged: false,
    },
    validators: {
      onSubmit: confirmationSchema,
    },
    onSubmit: async (_: { value: WorkspaceDangerFormValues }) => {
      if (isBlocked) {
        return;
      }

      const response = await onAction();

      if (!response.ok) {
        toast.error(
          kind === "leave" && response.errorCode === "LAST_OWNER_GUARD"
            ? t("status.lastOwnerGuard")
            : t("status.failed"),
          { id: toastId }
        );
        return;
      }

      toast.success(t("status.success"), { id: toastId });
      setIsOpen(false);
      form.reset();
    },
  });

  function handleOpenChange(open: boolean) {
    if (isBlocked && open) {
      return;
    }

    setIsOpen(open);

    if (open) {
      form.reset();
    }
  }

  return (
    <SettingsItem variant="destructive" disabled={isBlocked}>
      <SettingsItemContent>
        <SettingsItemContentHeader>
          <SettingsItemTitle>{t("title")}</SettingsItemTitle>
          <SettingsItemDescription>
            {t("description", {
              workspaceName: workspace.name,
            })}
          </SettingsItemDescription>
        </SettingsItemContentHeader>
      </SettingsItemContent>

      <SettingsItemFooter>
        {isBlocked && (
          <SettingsItemDescription>
            {kind === "leave" ? t("ownerGuardHint") : tCommon("readOnlyHint")}
          </SettingsItemDescription>
        )}
        <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger
            nativeButton={true}
            render={
              <Button
                type="button"
                variant="destructive"
                size="lg"
                className="sm:ml-auto"
                disabled={isBlocked}
              >
                {t("trigger")}
              </Button>
            }
          />
          <AlertDialogContent className="sm:max-w-lg">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                form.handleSubmit();
              }}
              className="contents"
            >
              <form.Subscribe
                selector={(state) => ({
                  isSubmitting: state.isSubmitting,
                  submissionAttempts: state.submissionAttempts,
                })}
              >
                {({ isSubmitting, submissionAttempts }) => (
                  <>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("dialog.title")}</AlertDialogTitle>
                      <AlertDialogDescription>{t("dialog.description")}</AlertDialogDescription>
                    </AlertDialogHeader>

                    <FieldGroup className="mt-4 flex flex-col gap-6 pb-2">
                      <form.Field name="confirmationUrl">
                        {(field) => {
                          const isInvalid =
                            (field.state.meta.isTouched || submissionAttempts > 0) &&
                            !field.state.meta.isValid;

                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={`workspace-${kind}-${field.name}`}>
                                {t("dialog.fields.confirmationUrl.label")}
                              </FieldLabel>
                              <Input
                                id={`workspace-${kind}-${field.name}`}
                                name={`workspace-${kind}-${field.name}`}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(event) => field.handleChange(event.target.value)}
                                autoComplete="off"
                                placeholder={workspace.slug}
                                aria-invalid={isInvalid}
                              />
                              <FieldDescription>
                                {t("dialog.fields.confirmationUrl.description", {
                                  workspaceSlug: workspace.slug,
                                })}
                              </FieldDescription>
                              {isInvalid && <FieldError errors={field.state.meta.errors} />}
                            </Field>
                          );
                        }}
                      </form.Field>

                      <form.Field name="isAcknowledged">
                        {(field) => {
                          const isInvalid =
                            (field.state.meta.isTouched || submissionAttempts > 0) &&
                            !field.state.meta.isValid;

                          return (
                            <div className="flex flex-col gap-2">
                              <Field orientation="horizontal" data-invalid={isInvalid}>
                                <Checkbox
                                  id={`workspace-${kind}-${field.name}`}
                                  name={`workspace-${kind}-${field.name}`}
                                  checked={field.state.value}
                                  onBlur={field.handleBlur}
                                  onCheckedChange={(checked) =>
                                    field.handleChange(checked === true)
                                  }
                                  aria-invalid={isInvalid}
                                />
                                <FieldLabel htmlFor={`workspace-${kind}-${field.name}`}>
                                  {t("dialog.fields.acknowledged.label")}
                                </FieldLabel>
                              </Field>
                              {isInvalid && <FieldError errors={field.state.meta.errors} />}
                            </div>
                          );
                        }}
                      </form.Field>
                    </FieldGroup>

                    <AlertDialogFooter>
                      <AlertDialogCancel type="button" size="lg" disabled={isSubmitting}>
                        {tCommon("cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        type="submit"
                        size="lg"
                        variant="destructive"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Spinner />
                        ) : (
                          <Icon aria-hidden="true" className="size-4" />
                        )}
                        {isSubmitting ? t("dialog.submit.pending") : t("dialog.submit.default")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </>
                )}
              </form.Subscribe>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </SettingsItemFooter>
    </SettingsItem>
  );
}
