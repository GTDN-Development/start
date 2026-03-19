// import * as React from "react";
import { useState } from "react";
import { useMountEffect } from "@/hooks/use-mount-effect";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useMountEffect(() => {
    const mediaQueryList = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    mediaQueryList.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    return function cleanupMobileMediaQuery() {
      mediaQueryList.removeEventListener("change", onChange);
    };
  });

  return !!isMobile;
}
