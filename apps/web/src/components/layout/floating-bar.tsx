"use client";

import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const floatingBarVariants = cva("top-0 isolate", {
  variants: {
    position: {
      sticky: "sticky",
      fixed: "fixed",
    },
  },
  defaultVariants: {
    position: "sticky",
  },
});

function FloatingBar({
  className,
  position,
  autoHide,
  scrolledThreshold = 64,
  scrolledExitOffset = 8,
  autoHideThreshold = 512,
  render,
  ...props
}: useRender.ComponentProps<"div"> &
  VariantProps<typeof floatingBarVariants> & {
    autoHide?: boolean;
    scrolledThreshold?: number;
    scrolledExitOffset?: number;
    autoHideThreshold?: number;
  }) {
  const [isHidden, setIsHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const isSticky = position === "sticky";
  const isFixed = position === "fixed";

  const prevScrollY = useRef(0);
  const isScrolledRef = useRef(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setIsMounted(true);
    });
  }, []);

  useEffect(() => {
    isScrolledRef.current = isScrolled;
  }, [isScrolled]);

  useLayoutEffect(() => {
    if (!(isSticky || isFixed) || !isMounted) return;

    const exitThreshold = Math.max(scrolledThreshold - scrolledExitOffset, 0);

    function updateScrolledState(nextIsScrolled: boolean) {
      if (isScrolledRef.current === nextIsScrolled) return;

      isScrolledRef.current = nextIsScrolled;
      setIsScrolled(nextIsScrolled);
    }

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const nextIsScrolled = isScrolledRef.current
        ? currentScrollY > exitThreshold
        : currentScrollY > scrolledThreshold;

      updateScrolledState(nextIsScrolled);

      if (!autoHide) return;

      if (currentScrollY > autoHideThreshold && currentScrollY > prevScrollY.current) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }

      prevScrollY.current = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    Promise.resolve().then(() => {
      handleScroll();
    });

    return function cleanupFloatingBarScrollListener() {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [
    autoHide,
    isSticky,
    isFixed,
    autoHideThreshold,
    position,
    scrolledThreshold,
    scrolledExitOffset,
    isMounted,
  ]);

  return useRender({
    render,
    defaultTagName: "div",
    props: {
      ...props,
      "data-scrolled": isMounted && isScrolled ? "true" : undefined,
      "data-hidden": isMounted && isHidden ? "true" : undefined,
      className: cn(floatingBarVariants({ position, className })),
    },
  });
}

export { FloatingBar, floatingBarVariants };
