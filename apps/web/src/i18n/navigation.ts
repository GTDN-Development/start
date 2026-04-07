import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, getPathname, redirect, usePathname, useRouter } = createNavigation(routing);

export type AppHref = Parameters<typeof getPathname>[0]["href"];
export type AppPathname = Extract<AppHref, string>;
