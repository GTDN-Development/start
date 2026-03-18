import { useEffect } from "react";

export function useMountEffect(effect: () => void | (() => void)) {
  // This hook intentionally models mount/unmount semantics only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, []);
}
