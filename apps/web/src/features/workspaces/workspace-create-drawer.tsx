"use client";

import { useForm } from "@tanstack/react-form";
import { startTransition, useId } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/spinner";
import { getWorkspaceOverviewHref } from "@/config/routes";
import { createWorkspaceAction } from "@/features/workspaces/settings/general/workspace-general-actions";
import {
  createWorkspaceNameFormSchema,
  workspaceNameMaxLength,
} from "@/features/workspaces/workspace-schemas";
import { useOptionalWorkspaceNavigation } from "@/features/workspaces/workspace-navigation-context";
import { useRouter } from "@/i18n/navigation";
import { resolveErrorMessage, runAsyncTransition } from "@/lib/app-utils";

type WorkspaceCreateFormValues = {
  name: string;
};

type WorkspaceCreateDrawerProps = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
};

export function WorkspaceCreateDrawer({ open, onOpenChangeAction }: WorkspaceCreateDrawerProps) {
  const t = useTranslations("layout.application.scopeSwitcher.createDrawer");
  const workspaceNavigation = useOptionalWorkspaceNavigation();
  const router = useRouter();
  const createToastId = useId();

  const createWorkspaceSchema = createWorkspaceNameFormSchema({
    required: t("validation.nameRequired"),
    max: t("validation.nameMax", {
      max: String(workspaceNameMaxLength),
    }),
  });

  const form = useForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onSubmit: createWorkspaceSchema,
    },
    onSubmit: async ({ value }: { value: WorkspaceCreateFormValues }) => {
      const trimmedName = value.name.trim();
      const response = await runAsyncTransition(() => createWorkspaceAction({ name: trimmedName }));

      if (!response.ok) {
        toast.error(
          resolveErrorMessage(response.errorCode, t("status.failed"), {
            BAD_REQUEST: t("status.badRequest"),
            UNAUTHORIZED: t("status.unauthorized"),
          }),
          {
            id: createToastId,
          }
        );
        return;
      }

      toast.success(t("status.created"), {
        id: createToastId,
      });

      startTransition(() => {
        workspaceNavigation?.upsertWorkspace(response.data.workspace);
        workspaceNavigation?.setActiveWorkspaceSlug(response.data.workspaceSlug);
        form.reset();
        onOpenChangeAction(false);
        router.replace(getWorkspaceOverviewHref(response.data.workspaceSlug));
      });
    },
  });

  function handleDrawerOpenChange(nextOpen: boolean) {
    onOpenChangeAction(nextOpen);

    if (!nextOpen) {
      form.reset();
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleDrawerOpenChange} direction="right">
      <DrawerContent className="w-full p-0 sm:max-w-md">
        <DrawerHeader className="border-border border-b p-5">
          <DrawerTitle>{t("title")}</DrawerTitle>
          <DrawerDescription>{t("description")}</DrawerDescription>
        </DrawerHeader>

        <form
          className="flex h-full min-h-0 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <form.Subscribe
              selector={(state) => ({
                submissionAttempts: state.submissionAttempts,
              })}
            >
              {({ submissionAttempts }) => (
                <FieldGroup>
                  <form.Field name="name">
                    {(field) => {
                      const isInvalid =
                        (field.state.meta.isTouched || submissionAttempts > 0) &&
                        !field.state.meta.isValid;

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={`workspace-create-${field.name}`}>
                            {t("fields.name.label")}
                          </FieldLabel>
                          <Input
                            id={`workspace-create-${field.name}`}
                            name={`workspace-create-${field.name}`}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                            placeholder={t("fields.name.placeholder")}
                            aria-invalid={isInvalid}
                            autoComplete="off"
                          />
                          <FieldDescription>{t("fields.name.description")}</FieldDescription>
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      );
                    }}
                  </form.Field>
                </FieldGroup>
              )}
            </form.Subscribe>
          </div>

          <form.Subscribe
            selector={(state) => ({
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ isSubmitting }) => (
              <DrawerFooter className="border-border border-t p-5 sm:flex-row sm:justify-end">
                <DrawerClose asChild>
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    {t("cancel")}
                  </Button>
                </DrawerClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Spinner />}
                  {isSubmitting ? t("submit.pending") : t("submit.default")}
                </Button>
              </DrawerFooter>
            )}
          </form.Subscribe>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
