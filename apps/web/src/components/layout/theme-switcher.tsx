"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useHydrated } from "@/hooks/use-hydrated";

export type ThemeSwitcherProps = {
  className?: string;
  size?: "sm" | "default";
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
      className="focus-visible:ring-ring data-checked:text-foreground text-muted-foreground data-checked:bg-muted relative flex size-8 items-center justify-center rounded-full group-data-[size=sm]/theme-switcher:size-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      {children}
    </Radio.Root>
  );
}

export function ThemeSwitcher({ size = "default", className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("layout.themeSwitcher");
  const isHydrated = useHydrated();

  function handleValueChange(value: string) {
    setTheme(value);
  }

  if (!isHydrated) {
    return null;
  }

  return (
    <RadioGroup
      value={theme}
      onValueChange={(value) => handleValueChange(value as string)}
      data-size={size === "sm" ? "sm" : undefined}
      className={cn(
        "group/theme-switcher bg-background ring-border relative isolate flex h-10 rounded-full p-1 ring-1 data-[size='sm']:h-8",
        className
      )}
    >
      <ToggleButton value="light" label={t("light")}>
        <SunIcon aria-hidden="true" className="size-4 group-data-[size=sm]/theme-switcher:size-3" />
      </ToggleButton>
      <ToggleButton value="system" label={t("system")}>
        <MonitorIcon
          aria-hidden="true"
          className="size-4 group-data-[size=sm]/theme-switcher:size-3"
        />
      </ToggleButton>
      <ToggleButton value="dark" label={t("dark")}>
        <MoonIcon
          aria-hidden="true"
          className="size-4 group-data-[size=sm]/theme-switcher:size-3"
        />
      </ToggleButton>
    </RadioGroup>
  );
}
