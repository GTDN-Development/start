"use client";

import { useForm } from "@tanstack/react-form";
import { useId, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { StaticPlaceholder } from "@/components/ui/static-placeholder";

const DEFAULT_WORKSPACE_NAME = "Acme Studio";
const MAX_WORKSPACE_NAME_LENGTH = 48;

type WorkspaceNameFormValues = {
  name: string;
};

export function WorkspaceNameSettingsItem() {
  const nameToastId = useId();
  const [workspaceName, setWorkspaceName] = useState(DEFAULT_WORKSPACE_NAME);
  const workspaceNameSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, {
        message: "Workspace name is required.",
      })
      .max(MAX_WORKSPACE_NAME_LENGTH, {
        message: `Workspace name must be at most ${MAX_WORKSPACE_NAME_LENGTH} characters long.`,
      }),
  });

  const form = useForm({
    defaultValues: {
      name: workspaceName,
    },
    validators: {
      onSubmit: workspaceNameSchema,
    },
    onSubmit: async ({ value }: { value: WorkspaceNameFormValues }) => {
      const nextName = value.name.trim();

      await Promise.resolve();

      setWorkspaceName(nextName);
      form.reset();
      form.setFieldValue("name", nextName);

      toast.success("Workspace updated", {
        id: nameToastId,
        description: "Workspace name was saved in this static preview.",
      });
    },
  });

  return (
    <SettingsItem>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Subscribe
          selector={(state) => ({
            isSubmitting: state.isSubmitting,
            submissionAttempts: state.submissionAttempts,
          })}
        >
          {({ isSubmitting, submissionAttempts }) => (
            <>
              <SettingsItemContent className="flex flex-col gap-6">
                <SettingsItemContentHeader>
                  <StaticPlaceholder />
                  <SettingsItemTitle>Workspace name</SettingsItemTitle>
                  <SettingsItemDescription>
                    Update how this workspace appears across the app.
                  </SettingsItemDescription>
                </SettingsItemContentHeader>

                <SettingsItemContentBody>
                  <div className="grid gap-4">
                    <form.Field name="name">
                      {(field) => {
                        const isInvalid =
                          (field.state.meta.isTouched || submissionAttempts > 0) &&
                          !field.state.meta.isValid;

                        return (
                          <Field data-invalid={isInvalid} className="grid max-w-md gap-2">
                            <FieldLabel htmlFor={`workspace-general-name-${field.name}`}>
                              Name
                            </FieldLabel>
                            <Input
                              id={`workspace-general-name-${field.name}`}
                              name={`workspace-general-name-${field.name}`}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(event) => field.handleChange(event.target.value)}
                              placeholder="Enter workspace name"
                              autoComplete="organization"
                              aria-invalid={isInvalid}
                            />
                            <FieldDescription>
                              This name is visible in navigation and workspace switcher.
                            </FieldDescription>
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        );
                      }}
                    </form.Field>
                  </div>
                </SettingsItemContentBody>
              </SettingsItemContent>

              <SettingsItemFooter>
                <SettingsItemDescription>Maximum length is 32 characters.</SettingsItemDescription>
                <Button type="submit" size="lg" disabled={isSubmitting} className="sm:self-end">
                  {isSubmitting && <Spinner />}
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </SettingsItemFooter>
            </>
          )}
        </form.Subscribe>
      </form>
    </SettingsItem>
  );
}
