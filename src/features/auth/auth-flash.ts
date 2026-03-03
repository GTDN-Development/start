const AUTH_FLASH_KEY = "auth-flash";

export type AuthFlashType = "email-verified" | "password-reset";

export function setAuthFlash(type: AuthFlashType) {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  sessionStorage.setItem(AUTH_FLASH_KEY, type);
}

export function consumeAuthFlash(): AuthFlashType | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  const value = sessionStorage.getItem(AUTH_FLASH_KEY);
  sessionStorage.removeItem(AUTH_FLASH_KEY);

  if (value === "email-verified" || value === "password-reset") {
    return value;
  }

  return null;
}
