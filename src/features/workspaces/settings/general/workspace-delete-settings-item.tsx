"use client";

import { useForm } from "@tanstack/react-form";
import { useId, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Trash2Icon } from "lucide-react";
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
import { deleteOrganizationWorkspaceAction } from "@/features/workspaces/actions/workspace-actions";
import type { WorkspaceSettingsWorkspace } from "@/features/workspaces/settings/workspace-settings-types";
import { useRouter } from "@/i18n/navigation";

type DeleteWorkspaceFormValues = {
  confirmationUrl: string;
  isDeletionAcknowledged: boolean;
};

export function WorkspaceDeleteSettingsItem({
  workspace,
}: {
  workspace: WorkspaceSettingsWorkspace;
}) {
  const router = useRouter();
  const isPersonalWorkspace = workspace.kind === "personal";
  const deleteWorkspaceToastId = useId();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteWorkspaceSchema = z.object({
    confirmationUrl: z
      .string()
      .trim()
      .min(1, {
        message: "Workspace URL is required.",
      })
      .refine((value) => value === workspace.slug, {
        message: `Type "${workspace.slug}" to confirm.`,
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
      const response = await deleteOrganizationWorkspaceAction(workspace.slug);

      if (!response.ok) {
        toast.error("Delete failed", {
          id: deleteWorkspaceToastId,
          description: "Workspace could not be deleted.",
        });
        return;
      }

      toast.success("Workspace deleted", {
        id: deleteWorkspaceToastId,
        description: "Workspace was deleted.",
      });

      setIsDeleteDialogOpen(false);
      form.reset();
      router.replace("/overview");
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
          <SettingsItemTitle>Delete workspace</SettingsItemTitle>
          <SettingsItemDescription>
            Permanently remove <strong>{workspace.name}</strong> and all workspace data.
          </SettingsItemDescription>
        </SettingsItemContentHeader>
      </SettingsItemContent>

      <SettingsItemFooter className="sm:justify-end">
        {isPersonalWorkspace && (
          <SettingsItemDescription>
            Personal workspace cannot be deleted. It is required for your account.
          </SettingsItemDescription>
        )}
        {!isPersonalWorkspace && (
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
                                  placeholder={workspace.slug}
                                  aria-invalid={isInvalid}
                                />
                                <FieldDescription>
                                  Type <strong>{workspace.slug}</strong> to confirm deletion.
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
                                    onCheckedChange={(checked) =>
                                      field.handleChange(checked === true)
                                    }
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
                          {isSubmitting ? (
                            <Spinner />
                          ) : (
                            <Trash2Icon aria-hidden="true" className="size-4" />
                          )}
                          {isSubmitting ? "Deleting..." : "Delete workspace"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </>
                  )}
                </form.Subscribe>
              </form>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </SettingsItemFooter>
    </SettingsItem>
  );
}
