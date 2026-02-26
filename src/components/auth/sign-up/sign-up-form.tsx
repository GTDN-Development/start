"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon, UserPlusIcon } from "lucide-react";
import { Link } from "@/components/ui/link";
import { legalLinks } from "@/config/legal-links";

import { authRedirectPaths } from "@/features/auth/auth-redirects";
import { readAuthFormApiResponse } from "@/features/auth/auth-form-api";
import { cn } from "@/lib/utils";

type SignUpFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
};

export function SignUpForm({ className, ...props }: React.ComponentProps<"div">) {
  const t = useTranslations("forms.signUp");
  const router = useRouter();
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  const signUpFormSchema = z
    .object({
      firstName: z
        .string()
        .min(2, { message: t("validation.firstNameMin") })
        .max(50, { message: t("validation.firstNameMax") }),
      lastName: z
        .string()
        .min(2, { message: t("validation.lastNameMin") })
        .max(50, { message: t("validation.lastNameMax") }),
      email: z.email({ message: t("validation.email") }),
      password: z
        .string()
        .min(8, { message: t("validation.passwordMin") })
        .max(100, { message: t("validation.passwordMax") }),
      confirmPassword: z.string().min(8, { message: t("validation.confirmPassword") }),
      termsAccepted: z.boolean().refine((value) => value === true, {
        message: t("validation.termsAccepted"),
      }),
    })
    .superRefine((values, ctx) => {
      if (values.password !== values.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          message: t("validation.passwordMismatch"),
          path: ["confirmPassword"],
        });
      }
    });

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
    validators: {
      onSubmit: signUpFormSchema,
    },
    onSubmit: async ({ value }: { value: SignUpFormValues }) => {
      setSubmitErrorMessage(null);

      try {
        const response = await fetch("/api/sign-up", {
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
          setSubmitErrorMessage(getSignUpErrorMessage(t, result?.errorCode));
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
              <div className="grid gap-4 @lg:grid-cols-2">
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

              <form.Field name="confirmPassword">
                {(field) => {
                  const isInvalid =
                    (field.state.meta.isTouched || submissionAttempts > 0) &&
                    !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={`signup-${field.name}`}>
                        {t("fields.confirmPassword.label")}
                      </FieldLabel>
                      <PasswordInput
                        id={`signup-${field.name}`}
                        name={`signup-${field.name}`}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        autoComplete="new-password"
                        placeholder={t("fields.confirmPassword.placeholder")}
                        showPasswordLabel={t("passwordVisibility.show")}
                        hidePasswordLabel={t("passwordVisibility.hide")}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="termsAccepted">
                {(field) => {
                  const isInvalid =
                    (field.state.meta.isTouched || submissionAttempts > 0) &&
                    !field.state.meta.isValid;
                  return (
                    <div className="flex flex-col gap-y-2">
                      <Field orientation="horizontal" data-invalid={isInvalid}>
                        <Checkbox
                          id={`signup-${field.name}`}
                          name={`signup-${field.name}`}
                          checked={field.state.value}
                          onCheckedChange={(checked) => field.handleChange(checked === true)}
                          aria-invalid={isInvalid}
                        />
                        <FieldLabel htmlFor={`signup-${field.name}`}>
                          <span>
                            {t.rich("fields.termsAccepted.label", {
                              link: (chunks) => (
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
                          </span>
                        </FieldLabel>
                      </Field>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </div>
                  );
                }}
              </form.Field>

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
            </FieldGroup>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}

function getSignUpErrorMessage(t: (key: string) => string, errorCode?: string) {
  if (errorCode === "EMAIL_ALREADY_IN_USE") {
    return t("status.error.emailAlreadyInUse");
  }

  return t("status.error.message");
}
