"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon, CheckCircleIcon, LogInIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const loginFormSchema = z.object({
  email: z.email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

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
      setIsSubmitting(true);
      setSubmitStatus({ type: null, message: "" });

      try {
        const response = await fetch("/api/login", {
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
            message: data.message || "Signed in successfully!",
          });
          form.reset();
        } else {
          setSubmitStatus({
            type: "error",
            message: data.error || "Invalid credentials. Please try again.",
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
          <form.Field name="email">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={`login-${field.name}`}>Email address</FieldLabel>
                  <Input
                    id={`login-${field.name}`}
                    name={`login-${field.name}`}
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
                  <FieldLabel htmlFor={`login-${field.name}`}>Password</FieldLabel>
                  <Input
                    id={`login-${field.name}`}
                    name={`login-${field.name}`}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="••••••••"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="rememberMe">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field orientation="horizontal" data-invalid={isInvalid}>
                  <Checkbox
                    id={`login-${field.name}`}
                    name={`login-${field.name}`}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked === true)}
                    aria-invalid={isInvalid}
                  />
                  <FieldLabel htmlFor={`login-${field.name}`}>Remember me</FieldLabel>
                </Field>
              );
            }}
          </form.Field>

          <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
            {isSubmitting ? <Spinner /> : <LogInIcon aria-hidden="true" className="size-4" />}
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>

          {submitStatus.type && (
            <Alert variant={submitStatus.type === "error" ? "destructive" : "default"}>
              {submitStatus.type === "success" ? (
                <CheckCircleIcon aria-hidden="true" className="size-4" />
              ) : (
                <AlertCircleIcon aria-hidden="true" className="size-4" />
              )}
              <AlertTitle>
                {submitStatus.type === "success" ? "Signed in" : "Sign in failed"}
              </AlertTitle>
              <AlertDescription>{submitStatus.message}</AlertDescription>
            </Alert>
          )}
        </FieldGroup>
      </form>
    </div>
  );
}
