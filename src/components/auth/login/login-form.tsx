"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon, LogInIcon } from "lucide-react";

import { authRedirectPaths } from "@/features/auth/auth-redirects";
import { readAuthFormApiResponse } from "@/features/auth/auth-form-api";
import { cn } from "@/lib/utils";

type LoginFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const t = useTranslations("forms.login");
  const router = useRouter();
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  const loginFormSchema = z.object({
    email: z.email({
      message: t("validation.email"),
    }),
    password: z.string().min(8, {
      message: t("validation.password"),
    }),
    rememberMe: z.boolean(),
  });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    validators: {
      onSubmit: loginFormSchema,
    },
    onSubmit: async ({ value }: { value: LoginFormValues }) => {
      setSubmitErrorMessage(null);

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(value),
        });

        const result = await readAuthFormApiResponse(response);

        if (response.ok) {
          router.replace(result?.redirectTo ?? authRedirectPaths.dashboard);
        } else {
          setSubmitErrorMessage(t("status.error.message"));
        }
      } catch {
        setSubmitErrorMessage(t("status.error.message"));
      }
    },
  });

  return (
    <div {...props} className={cn("@container w-full", className)}>
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
            <FieldGroup>
              <form.Field name="email">
                {(field) => {
                  const isInvalid =
                    (field.state.meta.isTouched || submissionAttempts > 0) &&
                    !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={`login-${field.name}`}>
                        {t("fields.email.label")}
                      </FieldLabel>
                      <Input
                        id={`login-${field.name}`}
                        name={`login-${field.name}`}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        autoComplete="email"
                        placeholder={t("fields.email.placeholder")}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="password">
                {(field) => {
                  const isInvalid =
                    (field.state.meta.isTouched || submissionAttempts > 0) &&
                    !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={`login-${field.name}`}>
                        {t("fields.password.label")}
                      </FieldLabel>
                      <Input
                        id={`login-${field.name}`}
                        name={`login-${field.name}`}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        autoComplete="current-password"
                        placeholder={t("fields.password.placeholder")}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="rememberMe">
                {(field) => {
                  const isInvalid =
                    (field.state.meta.isTouched || submissionAttempts > 0) &&
                    !field.state.meta.isValid;
                  return (
                    <Field orientation="horizontal" data-invalid={isInvalid}>
                      <Checkbox
                        id={`login-${field.name}`}
                        name={`login-${field.name}`}
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked === true)}
                        aria-invalid={isInvalid}
                      />
                      <FieldLabel htmlFor={`login-${field.name}`}>
                        {t("fields.rememberMe.label")}
                      </FieldLabel>
                    </Field>
                  );
                }}
              </form.Field>

              <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
                {isSubmitting ? <Spinner /> : <LogInIcon aria-hidden="true" className="size-4" />}
                {isSubmitting ? t("submit.pending") : t("submit.default")}
              </Button>

              {submitErrorMessage && (
                <Alert variant="destructive">
                  <AlertCircleIcon aria-hidden="true" className="size-4" />
                  <AlertTitle>{t("status.error.title")}</AlertTitle>
                  <AlertDescription>{submitErrorMessage}</AlertDescription>
                </Alert>
              )}
            </FieldGroup>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
