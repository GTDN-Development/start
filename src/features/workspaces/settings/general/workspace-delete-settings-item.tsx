"use client";

import { useForm } from "@tanstack/react-form";
import { useId, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
import { StaticPlaceholder } from "@/components/ui/static-placeholder";
import { Trash2Icon } from "lucide-react";

const WORKSPACE_NAME = "Acme Studio";
const WORKSPACE_URL = "acme-studio";

type DeleteWorkspaceFormValues = {
  confirmationUrl: string;
  isDeletionAcknowledged: boolean;
};

export function WorkspaceDeleteSettingsItem() {
  const deleteWorkspaceToastId = useId();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteWorkspaceSchema = z.object({
    confirmationUrl: z
      .string()
      .trim()
      .min(1, {
        message: "Workspace URL is required.",
      })
      .refine((value) => value === WORKSPACE_URL, {
        message: `Type "${WORKSPACE_URL}" to confirm.`,
      }),
    isDeletionAcknowledged: z.boolean().refine((value) => value === true, {
      message: "You must confirm that this action cannot be undone.",
    }),
  });

  const form = useForm({
    defaultValues: {
      confirmationUrl: "",
      isDeletionAcknowledged: false,
    },
    validators: {
      onSubmit: deleteWorkspaceSchema,
    },
    onSubmit: async (_: { value: DeleteWorkspaceFormValues }) => {
      await Promise.resolve();

      toast.success("Workspace deleted", {
        id: deleteWorkspaceToastId,
        description: "Static preview only. Backend delete will be connected later.",
      });

      setIsDeleteDialogOpen(false);
      form.reset();
    },
  });

  function handleDeleteDialogOpenChange(open: boolean) {
    setIsDeleteDialogOpen(open);

    if (open) {
      form.reset();
    }
  }

  return (
    <SettingsItem variant="destructive">
      <SettingsItemContent>
        <SettingsItemContentHeader>
          <StaticPlaceholder />
          <SettingsItemTitle>Delete workspace</SettingsItemTitle>
          <SettingsItemDescription>
            Permanently remove <strong>{WORKSPACE_NAME}</strong> and all workspace data.
          </SettingsItemDescription>
        </SettingsItemContentHeader>
      </SettingsItemContent>

      <SettingsItemFooter className="sm:justify-end">
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
          <AlertDialogTrigger
            nativeButton={true}
            render={
              <Button type="button" variant="destructive" size="lg">
                Delete workspace
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
                      <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action is irreversible. All members, invites, and data inside this
                        workspace will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <FieldGroup className="mt-4 flex flex-col gap-6 pb-2">
                      <form.Field name="confirmationUrl">
                        {(field) => {
                          const isInvalid =
                            (field.state.meta.isTouched || submissionAttempts > 0) &&
                            !field.state.meta.isValid;

                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={`workspace-delete-${field.name}`}>
                                Workspace URL
                              </FieldLabel>
                              <Input
                                id={`workspace-delete-${field.name}`}
                                name={`workspace-delete-${field.name}`}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(event) => field.handleChange(event.target.value)}
                                autoComplete="off"
                                placeholder={WORKSPACE_URL}
                                aria-invalid={isInvalid}
                              />
                              <FieldDescription>
                                Type <strong>{WORKSPACE_URL}</strong> to confirm deletion.
                              </FieldDescription>
                              {isInvalid && <FieldError errors={field.state.meta.errors} />}
                            </Field>
                          );
                        }}
                      </form.Field>

                      <form.Field name="isDeletionAcknowledged">
                        {(field) => {
                          const isInvalid =
                            (field.state.meta.isTouched || submissionAttempts > 0) &&
                            !field.state.meta.isValid;

                          return (
                            <div className="flex flex-col gap-2">
                              <Field orientation="horizontal" data-invalid={isInvalid}>
                                <Checkbox
                                  id={`workspace-delete-${field.name}`}
                                  name={`workspace-delete-${field.name}`}
                                  checked={field.state.value}
                                  onBlur={field.handleBlur}
                                  onCheckedChange={(checked) => field.handleChange(checked === true)}
                                  aria-invalid={isInvalid}
                                />
                                <FieldLabel htmlFor={`workspace-delete-${field.name}`}>
                                  I understand this action cannot be undone.
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
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        type="submit"
                        size="lg"
                        variant="destructive"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Spinner /> : <Trash2Icon aria-hidden="true" className="size-4" />}
                        {isSubmitting ? "Deleting..." : "Delete workspace"}
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
