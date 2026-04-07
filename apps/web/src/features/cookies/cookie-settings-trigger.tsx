"use client";

import { isCookieConsentEnabled } from "./cookie-consent";
import { useCookieContext } from "./cookie-context";

export function CookieSettingsTrigger({ onClick, ...props }: React.ComponentProps<"button">) {
  const { openSettingsDialog } = useCookieContext();

  if (!isCookieConsentEnabled()) {
    return null;
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    openSettingsDialog();
    onClick?.(event);
  }

  return <button {...props} onClick={handleClick} />;
}
