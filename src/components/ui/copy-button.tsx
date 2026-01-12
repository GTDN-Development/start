"use client";

import { useState, useEffect } from "react";

import { chain } from "@/lib/utils";

export function useClipboard(timeout: number = 2000) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isCopied) {
      const timeoutId = setTimeout(() => setIsCopied(false), timeout);
      return () => clearTimeout(timeoutId);
    }
  }, [isCopied, timeout]);

  function copy(text: string) {
    window.navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
    });
  }

  return { isCopied, copy };
}

export type CopyButtonRenderProps = {
  isCopied: boolean;
};

export type CopyButtonProps = Omit<React.ComponentProps<"button">, "children"> & {
  toCopy: string;
  timeout?: number;
  copiedContent?: React.ReactNode;
  children?: React.ReactNode | ((props: CopyButtonRenderProps) => React.ReactNode);
};

export function CopyButton({
  toCopy,
  timeout = 2000,
  copiedContent,
  onClick,
  children,
  ...props
}: CopyButtonProps) {
  const { isCopied, copy } = useClipboard(timeout);

  const renderProps: CopyButtonRenderProps = { isCopied };

  function renderChildren() {
    if (typeof children === "function") {
      return children(renderProps);
    }
    return isCopied && copiedContent ? copiedContent : children;
  }

  return (
    <button {...props} onClick={chain(() => copy(toCopy), onClick)}>
      {renderChildren()}
    </button>
  );
}
