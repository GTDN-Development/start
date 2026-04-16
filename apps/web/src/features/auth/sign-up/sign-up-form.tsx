"use client";

import { useForm } from "@tanstack/react-form";
import { useRef, useState } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { Turnstile, type TurnstileRef } from "@/components/ui/turnstile";
import { AlertCircleIcon, UserPlusIcon } from "lucide-react";
import { Link } from "@/components/ui/link";
import { legalLinks } from "@/config/menu";
import { isTurnstileEnabled } from "@/config/security";
import { signUpAction } from "@/features/auth/auth-actions";
import { createPendingVerifyEmailHref } from "@/features/auth/verify-email/verify-email-state";
import { createSignUpFormSchema, type SignUpInput } from "@/features/auth/auth-schemas";
import { runAsyncTransition } from "@/lib/app-utils";
import { cn } from "@/lib/utils";

type SignUpFormValues = SignUpInput & {
  turnstileToken: string;
};

export function SignUpForm({ className, ...props }: React.ComponentProps<"div">) {
  const t = useTranslations("forms.signUp");
  const router = useRouter();
  const turnstileRef = useRef<TurnstileRef>(null);
  const turnstileEnabled = isTurnstileEnabled();

  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  const signUpFormSchema = createSignUpFormSchema({
    firstNameMin: t("validation.firstNameMin"),
    firstNameMax: t("validation.firstNameMax"),
    lastNameMin: t("validation.lastNameMin"),
    lastNameMax: t("validation.lastNameMax"),
    email: t("validation.email"),
    passwordMin: t("validation.passwordMin"),
    passwordMax: t("validation.passwordMax"),
  });
  const turnstileSchema = z.object({
    turnstileToken: turnstileEnabled
      ? z.string().min(1, {
          message: t("validation.turnstile"),
        })
      : z.string(),
  });

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      turnstileToken: "",
    },
    validators: {
      onSubmit: signUpFormSchema.and(turnstileSchema),
    },
    onSubmit: async ({ value }: { value: SignUpFormValues }) => {
      setSubmitErrorMessage(null);

      const response = await runAsyncTransition(() =>
        signUpAction(turnstileEnabled ? value : { ...value, turnstileToken: undefined })
      );

      if (response.ok) {
        router.replace(
          createPendingVerifyEmailHref({
            email: value.email,
            delivery: response.data.verificationEmailStatus,
          })
        );
        return;
      }

      turnstileRef.current?.reset();
      form.setFieldValue("turnstileToken", "");

      if (response.errorCode === "EMAIL_ALREADY_IN_USE") {
        setSubmitErrorMessage(t("status.error.emailAlreadyInUse"));
        return;
      }

      if (response.errorCode === "WEAK_PASSWORD") {
        setSubmitErrorMessage(t("status.error.message"));
        return;
      }

      if (response.errorCode === "TURNSTILE_VERIFICATION_FAILED") {
        setSubmitErrorMessage(t("status.error.turnstile"));
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
              <div className="grid gap-4 @sm:grid-cols-2">
                <form.Field name="firstName">
                  {(field) => {
                    const isInvalid =
                      (field.state.meta.isTouched || submissionAttempts > 0) &&
                      !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={`signup-${field.name}`}>
                          {t("fields.firstName.label")}
                        </FieldLabel>
                        <Input
                          id={`signup-${field.name}`}
                          name={`signup-${field.name}`}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          autoComplete="given-name"
                          placeholder={t("fields.firstName.placeholder")}
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                </form.Field>

                <form.Field name="lastName">
                  {(field) => {
                    const isInvalid =
                      (field.state.meta.isTouched || submissionAttempts > 0) &&
                      !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={`signup-${field.name}`}>
                          {t("fields.lastName.label")}
                        </FieldLabel>
                        <Input
                          id={`signup-${field.name}`}
                          name={`signup-${field.name}`}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          autoComplete="family-name"
                          placeholder={t("fields.lastName.placeholder")}
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                </form.Field>
              </div>

              <form.Field name="email">
                {(field) => {
                  const isInvalid =
                    (field.state.meta.isTouched || submissionAttempts > 0) &&
                    !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={`signup-${field.name}`}>
                        {t("fields.email.label")}
                      </FieldLabel>
                      <Input
                        id={`signup-${field.name}`}
                        name={`signup-${field.name}`}
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
                      <FieldLabel htmlFor={`signup-${field.name}`}>
                        {t("fields.password.label")}
                      </FieldLabel>
                      <PasswordInput
                        id={`signup-${field.name}`}
                        name={`signup-${field.name}`}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        autoComplete="new-password"
                        placeholder={t("fields.password.placeholder")}
                        showPasswordLabel={t("passwordVisibility.show")}
                        hidePasswordLabel={t("passwordVisibility.hide")}
                      />
                      <FieldDescription>{t("fields.password.description")}</FieldDescription>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              {turnstileEnabled && (
                <form.Field name="turnstileToken">
                  {(field) => {
                    const isInvalid =
                      (field.state.meta.isTouched || submissionAttempts > 0) &&
                      !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <Turnstile
                          ref={turnstileRef}
                          onSuccess={(token: string) => field.handleChange(token)}
                          onError={() => field.handleChange("")}
                          onExpire={() => field.handleChange("")}
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                </form.Field>
              )}

              <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
                {isSubmitting ? (
                  <Spinner />
                ) : (
                  <UserPlusIcon aria-hidden="true" className="size-4" />
                )}
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
