"use client";

import type { ComponentProps, MouseEvent } from "react";
import { isCookieConsentEnabled } from "@/config/cookie-consent";
import { useCookieContext } from "./cookie-context";

export function CookieSettingsTrigger({ onClick, ...props }: ComponentProps<"button">) {
  const { openSettingsDialog } = useCookieContext();

  if (!isCookieConsentEnabled()) {
    return null;
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    openSettingsDialog();
    onClick?.(event);
  }

  return <button {...props} onClick={handleClick} />;
}
