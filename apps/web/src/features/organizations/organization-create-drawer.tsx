"use client";

import { useForm } from "@tanstack/react-form";
import { useId } from "react";
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
import { createOrganizationAction } from "@/features/organizations/settings/general/organization-general-actions";
import {
  createOrganizationNameFormSchema,
  organizationNameMaxLength,
} from "@/features/organizations/organization-schemas";
import { useApplyOrganizationNavigationPatch } from "@/features/organizations/organization-navigation-context";
import { resolveErrorMessage, runAsyncTransition } from "@/lib/app-utils";

type OrganizationCreateFormValues = {
  name: string;
};

type OrganizationCreateDrawerProps = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
};

export function OrganizationCreateDrawer({
  open,
  onOpenChangeAction,
}: OrganizationCreateDrawerProps) {
  const t = useTranslations("layout.application.scopeSwitcher.createDrawer");
  const applyOrganizationNavigationPatch = useApplyOrganizationNavigationPatch();
  const createToastId = useId();

  const createOrganizationSchema = createOrganizationNameFormSchema({
    required: t("validation.nameRequired"),
    max: t("validation.nameMax", {
      max: String(organizationNameMaxLength),
    }),
  });

  const form = useForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onSubmit: createOrganizationSchema,
    },
    onSubmit: async ({ value }: { value: OrganizationCreateFormValues }) => {
      const trimmedName = value.name.trim();
      const response = await runAsyncTransition(() =>
        createOrganizationAction({ name: trimmedName })
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

      applyOrganizationNavigationPatch(response.data.navigationPatch);
      form.reset();
      onOpenChangeAction(false);
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
                          <FieldLabel htmlFor={`organization-create-${field.name}`}>
                            {t("fields.name.label")}
                          </FieldLabel>
                          <Input
                            id={`organization-create-${field.name}`}
                            name={`organization-create-${field.name}`}
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
