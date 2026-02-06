"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export type ThemeSwitcherProps = {
  className?: string;
};

type ToggleButtonProps = {
  value: string;
  label: string;
  children: React.ReactNode;
};

function ToggleButton({ value, label, children }: ToggleButtonProps) {
  return (
    <Radio.Root
      value={value}
      aria-label={label}
      className="focus-visible:ring-ring data-checked:text-foreground text-muted-foreground data-checked:bg-muted relative flex size-8 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      {children}
    </Radio.Root>
  );
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("layout.themeSwitcher");
  const [mounted, setMounted] = useState(false);

  function handleValueChange(value: string) {
    setTheme(value);
  }

  useEffect(() => {
    // Defer state update to avoid synchronous setState in effect
    Promise.resolve().then(() => {
      setMounted(true);
    });
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <RadioGroup
      value={theme}
      onValueChange={(value) => handleValueChange(value as string)}
      className={cn(
        "bg-background ring-border relative isolate flex h-10 rounded-full p-1 ring-1",
        className
      )}
    >
      <ToggleButton value="light" label={t("light")}>
        <SunIcon aria-hidden="true" className="size-4" />
      </ToggleButton>
      <ToggleButton value="system" label={t("system")}>
        <MonitorIcon aria-hidden="true" className="size-4" />
      </ToggleButton>
      <ToggleButton value="dark" label={t("dark")}>
        <MoonIcon aria-hidden="true" className="size-4" />
      </ToggleButton>
    </RadioGroup>
  );
}
