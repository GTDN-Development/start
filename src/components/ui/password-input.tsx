"use client";

import * as React from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  groupClassName?: string;
  showPasswordLabel: string;
  hidePasswordLabel: string;
};

function PasswordInput({
  className,
  groupClassName,
  hidePasswordLabel,
  showPasswordLabel,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);

  function toggleVisibility() {
    setVisible((prev) => !prev);
  }

  return (
    <InputGroup className={groupClassName}>
      <InputGroupInput
        type={visible ? "text" : "password"}
        className={cn("pr-1.5", className)}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          variant="ghost"
          type="button"
          aria-label={visible ? hidePasswordLabel : showPasswordLabel}
          aria-pressed={visible}
          onClick={toggleVisibility}
        >
          {visible ? <EyeIcon aria-hidden="true" /> : <EyeOffIcon aria-hidden="true" />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export { PasswordInput, type PasswordInputProps };
