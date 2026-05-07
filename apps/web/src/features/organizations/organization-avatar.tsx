"use client";

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";

import { cn } from "@/lib/utils";

function OrganizationAvatar({
  className,
  size = "default",
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: "default" | "sm" | "lg";
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="organization-avatar"
      data-size={size}
      className={cn(
        "after:border-border group/organization-avatar relative flex size-8 shrink-0 rounded-md select-none after:absolute after:inset-0 after:rounded-md after:border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten",
        className
      )}
      {...props}
    />
  );
}

function OrganizationAvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="organization-avatar-image"
      className={cn("aspect-square size-full rounded-md object-cover", className)}
      {...props}
    />
  );
}

function OrganizationAvatarFallback({ className, ...props }: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="organization-avatar-fallback"
      className={cn(
        "bg-muted text-muted-foreground flex size-full items-center justify-center rounded-md text-sm group-data-[size=sm]/organization-avatar:text-xs",
        className
      )}
      {...props}
    />
  );
}

export { OrganizationAvatar, OrganizationAvatarImage, OrganizationAvatarFallback };
