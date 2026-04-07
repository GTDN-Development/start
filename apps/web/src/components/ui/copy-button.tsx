"use client";

import { useRef, useState } from "react";

import { useMountEffect } from "@/hooks/use-mount-effect";

export function useClipboard(timeout: number = 2000) {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutIdRef = useRef<number | null>(null);

  function clearResetTimeout() {
    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }

  useMountEffect(() => {
    return () => {
      clearResetTimeout();
    };
  });

  async function copy(text: string): Promise<boolean> {
    try {
      await window.navigator.clipboard.writeText(text);

      clearResetTimeout();
      setIsCopied(true);

      timeoutIdRef.current = window.setTimeout(() => {
        Promise.resolve().then(() => {
          setIsCopied(false);
          timeoutIdRef.current = null;
        });
      }, timeout);

      return true;
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      return false;
    }
  }

  return { isCopied, copy };
}

export type CopyButtonRenderProps = {
  isCopied: boolean;
};

export type CopyButtonProps = Omit<React.ComponentProps<"button">, "children" | "onCopy"> & {
  toCopy: string;
  timeout?: number;
  onCopy?: (value: string) => void;
  children?: React.ReactNode | ((props: CopyButtonRenderProps) => React.ReactNode);
};

export function CopyButton({
  toCopy,
  timeout = 2000,
  onCopy,
  onClick,
  children,
  "aria-label": ariaLabel,
  ...props
}: CopyButtonProps) {
  const { isCopied, copy } = useClipboard(timeout);

  const renderProps: CopyButtonRenderProps = { isCopied };

  function renderChildren() {
    if (typeof children === "function") {
      return children(renderProps);
    }
    return children;
  }

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const isCopySuccessful = await copy(toCopy);
    if (isCopySuccessful) {
      onCopy?.(toCopy);
    }
    onClick?.(event);
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel ?? (isCopied ? "Copied" : "Copy to clipboard")}
      {...props}
      onClick={handleClick}
    >
      {renderChildren()}
    </button>
  );
}
