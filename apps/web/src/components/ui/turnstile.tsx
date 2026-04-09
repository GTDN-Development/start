"use client";

import { Turnstile as TurnstilePrimitive, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useImperativeHandle, useRef } from "react";
import { getTurnstileConfig } from "@/config/security";

export type TurnstileRef = TurnstileInstance | undefined;

type TurnstileProps = {
  onSuccess?: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
};

export function Turnstile({
  onSuccess,
  onError,
  onExpire,
  className,
  ref,
}: TurnstileProps & { ref?: React.Ref<TurnstileRef> }) {
  const turnstileRef = useRef<TurnstileRef>(undefined);
  const turnstileConfig = getTurnstileConfig();

  useImperativeHandle(ref, function resolveTurnstileRef() {
    return turnstileRef.current;
  });

  if (!turnstileConfig.enabled) {
    return null;
  }

  // Show placeholder in development when API key is not defined.
  if (!turnstileConfig.siteKey && process.env.NODE_ENV !== "production") {
    return (
      <div
        className={`bg-destructive/20 text-destructive flex items-center justify-center p-2 ${className}`}
        style={{ width: "300px", height: "65px" }}
      >
        Missing Turnstile API key
      </div>
    );
  }

  return (
    <TurnstilePrimitive
      ref={turnstileRef}
      siteKey={turnstileConfig.siteKey ?? ""}
      onSuccess={onSuccess}
      onError={onError}
      onExpire={onExpire}
      className={className}
      options={{
        theme: "auto",
        size: "normal",
      }}
    />
  );
}
