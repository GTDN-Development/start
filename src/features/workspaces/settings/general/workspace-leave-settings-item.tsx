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
import { WORKSPACE_SETTINGS_PREVIEW } from "@/features/workspaces/settings/workspace-settings-preview";
import { LogOutIcon } from "lucide-react";

type LeaveWorkspaceFormValues = {
  confirmationUrl: string;
  isLeavingAcknowledged: boolean;
};

export function WorkspaceLeaveSettingsItem() {
  const isPersonalWorkspace = WORKSPACE_SETTINGS_PREVIEW.kind === "personal";
  const leaveWorkspaceToastId = useId();
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const leaveWorkspaceSchema = z.object({
    confirmationUrl: z
      .string()
      .trim()
      .min(1, {
        message: "Workspace URL is required.",
      })
      .refine((value) => value === WORKSPACE_SETTINGS_PREVIEW.slug, {
        message: `Type "${WORKSPACE_SETTINGS_PREVIEW.slug}" to confirm.`,
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
      await Promise.resolve();

      toast.success("Workspace left", {
        id: leaveWorkspaceToastId,
        description: "Static preview only. Backend leave flow will be connected later.",
      });

      setIsLeaveDialogOpen(false);
      form.reset();
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
          <StaticPlaceholder />
          <SettingsItemTitle>Leave workspace</SettingsItemTitle>
          <SettingsItemDescription>
            Leave <strong>{WORKSPACE_SETTINGS_PREVIEW.name}</strong> and remove your access to this
            workspace.
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
                                placeholder={WORKSPACE_SETTINGS_PREVIEW.slug}
                                aria-invalid={isInvalid}
                              />
                              <FieldDescription>
                                Type <strong>{WORKSPACE_SETTINGS_PREVIEW.slug}</strong> to confirm
                                leaving.
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
                                  onCheckedChange={(checked) => field.handleChange(checked === true)}
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
                        {isSubmitting ? <Spinner /> : <LogOutIcon aria-hidden="true" className="size-4" />}
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
