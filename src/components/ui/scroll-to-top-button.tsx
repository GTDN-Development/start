"use client";

export type ScrollToTopButtonProps = Omit<React.ComponentProps<"button">, "type"> & {
  top?: number;
  behavior?: ScrollBehavior;
};

export function ScrollToTopButton({
  top = 0,
  behavior = "smooth",
  onClick,
  ...props
}: ScrollToTopButtonProps) {
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }

    window.scrollTo({ top, behavior });
  }

  return <button type="button" {...props} onClick={handleClick} />;
}
