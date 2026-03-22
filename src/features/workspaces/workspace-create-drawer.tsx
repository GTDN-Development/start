"use client";

import { useForm } from "@tanstack/react-form";
import { startTransition, useId } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
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
import { app } from "@/config/app";
import { workspaceConfig } from "@/config/workspace";
import { createOrganizationWorkspaceAction } from "@/features/workspaces/actions/workspace-actions";
import { useRouter } from "@/i18n/navigation";
import { resolveErrorMessage } from "@/lib/app-utils";
import { runAsyncTransition } from "@/lib/utils";

type WorkspaceCreateFormValues = {
  name: string;
  slug: string;
};

type WorkspaceCreateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WorkspaceCreateDrawer({ open, onOpenChange }: WorkspaceCreateDrawerProps) {
  const t = useTranslations("layout.application.workspaceSwitcher.createDrawer");
  const router = useRouter();
  const createToastId = useId();
  const createWorkspaceSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, {
        message: t("validation.nameRequired"),
      })
      .max(workspaceConfig.limits.nameMaxLength, {
        message: t("validation.nameMax", {
          max: String(workspaceConfig.limits.nameMaxLength),
        }),
      }),
    slug: z
      .string()
      .trim()
      .max(workspaceConfig.limits.slugMaxLength, {
        message: t("validation.slugMax", {
          max: String(workspaceConfig.limits.slugMaxLength),
        }),
      })
      .refine(
        (value) => {
          if (!value) {
            return true;
          }

          return workspaceConfig.validation.slugPattern.test(value);
        },
        {
          message: t("validation.slugPattern"),
        }
      ),
  });

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
    },
    validators: {
      onSubmit: createWorkspaceSchema,
    },
    onSubmit: async ({ value }: { value: WorkspaceCreateFormValues }) => {
      const trimmedName = value.name.trim();
      const trimmedSlug = value.slug.trim();
      const response = await runAsyncTransition(() =>
        createOrganizationWorkspaceAction({
          name: trimmedName,
          ...(trimmedSlug ? { slug: trimmedSlug } : {}),
        })
      );

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
        form.reset();
        onOpenChange(false);
        router.replace({
          pathname: "/w/[workspaceSlug]/overview",
          params: {
            workspaceSlug: response.data.workspaceSlug,
          },
        });
      });
    },
  });

  function handleDrawerOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);

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

                  <form.Field name="slug">
                    {(field) => {
                      const isInvalid =
                        (field.state.meta.isTouched || submissionAttempts > 0) &&
                        !field.state.meta.isValid;

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={`workspace-create-${field.name}`}>
                            {t("fields.slug.label")}
                          </FieldLabel>
                          <InputGroup>
                            <InputGroupAddon>{app.site.domain}/w/</InputGroupAddon>
                            <InputGroupInput
                              id={`workspace-create-${field.name}`}
                              name={`workspace-create-${field.name}`}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(event) => field.handleChange(event.target.value)}
                              placeholder={t("fields.slug.placeholder")}
                              aria-invalid={isInvalid}
                              autoComplete="off"
                            />
                          </InputGroup>
                          <FieldDescription>{t("fields.slug.description")}</FieldDescription>
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
