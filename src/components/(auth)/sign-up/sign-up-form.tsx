"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon, CheckCircleIcon, UserPlusIcon } from "lucide-react";
import { Link } from "@/components/ui/link";
import { legalLinks } from "@/config/legal-links";

import { cn } from "@/lib/utils";

const signUpFormSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "First name must be at least 2 characters." })
      .max(50, { message: "First name must not exceed 50 characters." }),
    lastName: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters." })
      .max(50, { message: "Last name must not exceed 50 characters." }),
    email: z.email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .max(100, { message: "Password must not exceed 100 characters." }),
    confirmPassword: z.string().min(8, { message: "Please confirm your password." }),
    termsAccepted: z.boolean().refine((value) => value === true, {
      message: "You must accept the privacy policy.",
    }),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

type SignUpFormValues = z.infer<typeof signUpFormSchema>;

export function SignUpForm({ className, ...props }: React.ComponentProps<"div">) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

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
      setIsSubmitting(true);
      setSubmitStatus({ type: null, message: "" });

      try {
        const response = await fetch("/api/sign-up", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(value),
        });

        const data = await response.json();

        if (response.ok) {
          setSubmitStatus({
            type: "success",
            message: data.message || "Account created successfully!",
          });
          form.reset();
        } else {
          setSubmitStatus({
            type: "error",
            message: data.error || "Unable to create the account. Please try again.",
          });
        }
      } catch {
        setSubmitStatus({
          type: "error",
          message: "An unexpected error occurred. Please try again later.",
        });
      } finally {
        setIsSubmitting(false);
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
        <FieldGroup>
          <div className="grid gap-4 @lg:grid-cols-2">
            <form.Field name="firstName">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={`signup-${field.name}`}>First name</FieldLabel>
                    <Input
                      id={`signup-${field.name}`}
                      name={`signup-${field.name}`}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Jane"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="lastName">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={`signup-${field.name}`}>Last name</FieldLabel>
                    <Input
                      id={`signup-${field.name}`}
                      name={`signup-${field.name}`}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Doe"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </div>

          <form.Field name="email">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={`signup-${field.name}`}>Email address</FieldLabel>
                  <Input
                    id={`signup-${field.name}`}
                    name={`signup-${field.name}`}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="you@email.com"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="password">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={`signup-${field.name}`}>Password</FieldLabel>
                  <Input
                    id={`signup-${field.name}`}
                    name={`signup-${field.name}`}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Create a strong password"
                  />
                  <FieldDescription>Use at least 8 characters.</FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="confirmPassword">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={`signup-${field.name}`}>Confirm password</FieldLabel>
                  <Input
                    id={`signup-${field.name}`}
                    name={`signup-${field.name}`}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Repeat your password"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="termsAccepted">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
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
                      I agree to the{" "}
                      <Link
                        href={legalLinks.gdpr.href}
                        className="underline hover:no-underline"
                      >
                        privacy policy
                      </Link>
                      .
                    </span>
                  </FieldLabel>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
            {isSubmitting ? <Spinner /> : <UserPlusIcon aria-hidden="true" className="size-4" />}
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>

          {submitStatus.type && (
            <Alert variant={submitStatus.type === "error" ? "destructive" : "default"}>
              {submitStatus.type === "success" ? (
                <CheckCircleIcon aria-hidden="true" className="size-4" />
              ) : (
                <AlertCircleIcon aria-hidden="true" className="size-4" />
              )}
              <AlertTitle>
                {submitStatus.type === "success" ? "Account created" : "Sign up failed"}
              </AlertTitle>
              <AlertDescription>{submitStatus.message}</AlertDescription>
            </Alert>
          )}
        </FieldGroup>
      </form>
    </div>
  );
}
