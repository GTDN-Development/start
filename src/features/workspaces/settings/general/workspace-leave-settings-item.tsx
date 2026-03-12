"use client";

import { useForm } from "@tanstack/react-form";
import { useId, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { LogOutIcon } from "lucide-react";
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
import { leaveWorkspaceAction } from "@/features/workspaces/actions/workspace-actions";
import type { WorkspaceSettingsWorkspace } from "@/features/workspaces/settings/workspace-settings-types";
import { useRouter } from "@/i18n/navigation";

type LeaveWorkspaceFormValues = {
  confirmationUrl: string;
  isLeavingAcknowledged: boolean;
};

export function WorkspaceLeaveSettingsItem({ workspace }: { workspace: WorkspaceSettingsWorkspace }) {
  const router = useRouter();
  const isPersonalWorkspace = workspace.kind === "personal";
  const leaveWorkspaceToastId = useId();
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const leaveWorkspaceSchema = z.object({
    confirmationUrl: z
      .string()
      .trim()
      .min(1, {
        message: "Workspace URL is required.",
      })
      .refine((value) => value === workspace.slug, {
        message: `Type "${workspace.slug}" to confirm.`,
      }),
    isLeavingAcknowledged: z.boolean().refine((value) => value === true, {
      message: "You must confirm that you will lose access to this workspace.",
    }),
  });

  const form = useForm({
    defaultValues: {
      confirmationUrl: "",
      isLeavingAcknowledged: false,
    },
    validators: {
      onSubmit: leaveWorkspaceSchema,
    },
    onSubmit: async (_: { value: LeaveWorkspaceFormValues }) => {
      const response = await leaveWorkspaceAction(workspace.slug);

      if (!response.ok) {
        toast.error("Leave failed", {
          id: leaveWorkspaceToastId,
          description: "Workspace could not be left.",
        });
        return;
      }

      toast.success("Workspace left", {
        id: leaveWorkspaceToastId,
        description: "You no longer have access to this workspace.",
      });

      setIsLeaveDialogOpen(false);
      form.reset();
      router.replace("/overview");
    },
  });

  function handleLeaveDialogOpenChange(open: boolean) {
    setIsLeaveDialogOpen(open);

    if (open) {
      form.reset();
    }
  }

  return (
    <SettingsItem variant="destructive">
      <SettingsItemContent>
        <SettingsItemContentHeader>
          <SettingsItemTitle>Leave workspace</SettingsItemTitle>
          <SettingsItemDescription>
            Leave <strong>{workspace.name}</strong> and remove your access to this workspace.
          </SettingsItemDescription>
        </SettingsItemContentHeader>
      </SettingsItemContent>

      <SettingsItemFooter className="sm:justify-end">
        {isPersonalWorkspace && (
          <SettingsItemDescription>
            Personal workspace cannot be left. It always stays connected to your account.
          </SettingsItemDescription>
        )}
        {!isPersonalWorkspace && (
          <AlertDialog open={isLeaveDialogOpen} onOpenChange={handleLeaveDialogOpenChange}>
            <AlertDialogTrigger
              nativeButton={true}
              render={
                <Button type="button" variant="destructive" size="lg">
                  Leave workspace
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
                        <AlertDialogTitle>Leave workspace?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You will lose access to all workspace projects and settings. You can only
                          return if another member invites you again.
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
                                <FieldLabel htmlFor={`workspace-leave-${field.name}`}>
                                  Workspace URL
                                </FieldLabel>
                                <Input
                                  id={`workspace-leave-${field.name}`}
                                  name={`workspace-leave-${field.name}`}
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(event) => field.handleChange(event.target.value)}
                                  autoComplete="off"
                                  placeholder={workspace.slug}
                                  aria-invalid={isInvalid}
                                />
                                <FieldDescription>
                                  Type <strong>{workspace.slug}</strong> to confirm leaving.
                                </FieldDescription>
                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                              </Field>
                            );
                          }}
                        </form.Field>

                        <form.Field name="isLeavingAcknowledged">
                          {(field) => {
                            const isInvalid =
                              (field.state.meta.isTouched || submissionAttempts > 0) &&
                              !field.state.meta.isValid;

                            return (
                              <div className="flex flex-col gap-2">
                                <Field orientation="horizontal" data-invalid={isInvalid}>
                                  <Checkbox
                                    id={`workspace-leave-${field.name}`}
                                    name={`workspace-leave-${field.name}`}
                                    checked={field.state.value}
                                    onBlur={field.handleBlur}
                                    onCheckedChange={(checked) =>
                                      field.handleChange(checked === true)
                                    }
                                    aria-invalid={isInvalid}
                                  />
                                  <FieldLabel htmlFor={`workspace-leave-${field.name}`}>
                                    I understand I will lose access to this workspace.
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
                            <LogOutIcon aria-hidden="true" className="size-4" />
                          )}
                          {isSubmitting ? "Leaving..." : "Leave workspace"}
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
