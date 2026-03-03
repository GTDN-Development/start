"use client";

import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon, LogInIcon } from "lucide-react";
import { Link } from "@/components/ui/link";
import { legalLinks } from "@/config/legal-links";
import { signIn } from "@/features/auth/auth-client";
import { createSignInFormSchema, type SignInInput } from "@/features/auth/auth-schemas";
import { cn } from "@/lib/utils";

export function SignInForm({ className, ...props }: React.ComponentProps<"div">) {
  const t = useTranslations("forms.signIn");
  const router = useRouter();
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  const signInFormSchema = createSignInFormSchema({
    email: t("validation.email"),
    passwordMin: t("validation.passwordMin"),
    passwordMax: t("validation.passwordMax"),
  });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    validators: {
      onSubmit: signInFormSchema,
    },
    onSubmit: async ({ value }: { value: SignInInput }) => {
      setSubmitErrorMessage(null);

      const response = await signIn(value);

      if (response.ok) {
        router.replace("/overview");
        return;
      }

      if (response.errorCode === "INVALID_CREDENTIALS") {
        setSubmitErrorMessage(t("status.error.message"));
        return;
      }

      setSubmitErrorMessage(t("status.error.message"));
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
                      <FieldLabel htmlFor={`sign-in-${field.name}`}>
                        {t("fields.email.label")}
                      </FieldLabel>
                      <Input
                        id={`sign-in-${field.name}`}
                        name={`sign-in-${field.name}`}
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
                      <FieldLabel htmlFor={`sign-in-${field.name}`}>
                        {t("fields.password.label")}
                      </FieldLabel>
                      <PasswordInput
                        id={`sign-in-${field.name}`}
                        name={`sign-in-${field.name}`}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        autoComplete="current-password"
                        placeholder={t("fields.password.placeholder")}
                        showPasswordLabel={t("passwordVisibility.show")}
                        hidePasswordLabel={t("passwordVisibility.hide")}
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
                        id={`sign-in-${field.name}`}
                        name={`sign-in-${field.name}`}
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked === true)}
                        aria-invalid={isInvalid}
                      />
                      <FieldLabel htmlFor={`sign-in-${field.name}`}>
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

              <p className="text-muted-foreground text-center text-xs">
                {t.rich("legalNotice", {
                  termsOfService: (chunks) => (
                    <Link
                      href={legalLinks.termsOfService.href}
                      className="underline hover:no-underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {chunks}
                    </Link>
                  ),
                  privacyPolicy: (chunks) => (
                    <Link
                      href={legalLinks.gdpr.href}
                      className="underline hover:no-underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            </FieldGroup>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
