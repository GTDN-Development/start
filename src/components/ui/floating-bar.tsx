"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export type FloatingBarBaseProps = {
  position?: "sticky" | "fixed";
  autoHide?: boolean;
  scrolledThreshold?: number;
  autoHideThreshold?: number;
};

export type FloatingBarProps<T extends React.ElementType = "div"> = FloatingBarBaseProps & {
  as?: T;
} & React.ComponentPropsWithoutRef<T>;

export function FloatingBar<T extends React.ElementType = "div">({
  as,
  position = "sticky",
  autoHide,
  scrolledThreshold = 64,
  autoHideThreshold = 512,
  ...props
}: FloatingBarProps<T>) {
  const [isHidden, setIsHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isSticky = position === "sticky";
  const isFixed = position === "fixed";

  // previous scroll position
  const prevScrollY = useRef(0);

  useEffect(() => {
    if (!(isSticky || isFixed)) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Handle scrolled state
      if (currentScrollY > scrolledThreshold) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Handle auto-hide behavior
      if (!autoHide) return;

      if (currentScrollY > autoHideThreshold && currentScrollY > prevScrollY.current) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }

      // Update previous scroll position
      prevScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [autoHide, isSticky, isFixed, autoHideThreshold, scrolledThreshold]);

  const Element = as || "div";

  return (
    <Element
      {...props}
      data-scrolled={isScrolled ? "true" : undefined}
      data-hidden={isHidden ? "true" : undefined}
      className={clsx(props.className, "top-0 isolate", isSticky ? "sticky" : "fixed")}
    />
  );
}
