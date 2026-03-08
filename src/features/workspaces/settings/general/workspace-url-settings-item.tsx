"use client";

import { useForm } from "@tanstack/react-form";
import { useId, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { Spinner } from "@/components/ui/spinner";
import { StaticPlaceholder } from "@/components/ui/static-placeholder";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { site } from "@/config/site";

const DEFAULT_WORKSPACE_URL = "acme-studio";
const MAX_WORKSPACE_URL_LENGTH = 48;

type WorkspaceUrlFormValues = {
  url: string;
};

export function WorkspaceUrlSettingsItem() {
  const urlToastId = useId();
  const [workspaceUrl, setWorkspaceUrl] = useState(DEFAULT_WORKSPACE_URL);
  const workspaceUrlSchema = z.object({
    url: z
      .string()
      .trim()
      .min(1, {
        message: "Workspace URL is required.",
      })
      .max(MAX_WORKSPACE_URL_LENGTH, {
        message: `Workspace URL must be at most ${MAX_WORKSPACE_URL_LENGTH} characters long.`,
      }),
  });

  const form = useForm({
    defaultValues: {
      url: workspaceUrl,
    },
    validators: {
      onSubmit: workspaceUrlSchema,
    },
    onSubmit: async ({ value }: { value: WorkspaceUrlFormValues }) => {
      const nextUrl = value.url.trim();

      await Promise.resolve();

      setWorkspaceUrl(nextUrl);
      form.reset();
      form.setFieldValue("url", nextUrl);

      toast.success("Workspace updated", {
        id: urlToastId,
        description: "Workspace URL was saved in this static preview.",
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
                  <SettingsItemTitle>Workspace URL</SettingsItemTitle>
                  <SettingsItemDescription>
                    Set the URL segment used to access this workspace.
                  </SettingsItemDescription>
                </SettingsItemContentHeader>

                <SettingsItemContentBody>
                  <div className="grid gap-4">
                    <form.Field name="url">
                      {(field) => {
                        const isInvalid =
                          (field.state.meta.isTouched || submissionAttempts > 0) &&
                          !field.state.meta.isValid;

                        return (
                          <Field data-invalid={isInvalid} className="grid max-w-md gap-2">
                            <FieldLabel htmlFor={`workspace-general-url-${field.name}`}>
                              URL
                            </FieldLabel>
                            <InputGroup>
                              <InputGroupAddon>{site.domain}/w/</InputGroupAddon>
                              <InputGroupInput
                                id={`workspace-general-url-${field.name}`}
                                name={`workspace-general-url-${field.name}`}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(event) => field.handleChange(event.target.value)}
                                placeholder="Enter workspace URL"
                                autoComplete="off"
                                aria-invalid={isInvalid}
                              />
                            </InputGroup>
                            <FieldDescription>
                              Used in routes like /w/{workspaceUrl}/overview.
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
                <SettingsItemDescription>Maximum length is 48 characters.</SettingsItemDescription>
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
