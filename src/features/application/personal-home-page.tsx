"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRightIcon,
  LifeBuoyIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { useWorkspaceNavigation } from "@/features/workspaces/workspace-navigation-context";
import { WorkspaceCreateDrawer } from "@/features/workspaces/workspace-create-drawer";

const appHomeCards = [
  {
    key: "account",
    href: "/account" as const,
    icon: UserIcon,
  },
  {
    key: "preferences",
    href: "/account/preferences" as const,
    icon: Settings2Icon,
  },
  {
    key: "security",
    href: "/account/security" as const,
    icon: ShieldCheckIcon,
  },
  {
    key: "support",
    href: "/contact/support" as const,
    icon: LifeBuoyIcon,
  },
] as const;

export function PersonalHomePage() {
  const tApp = useTranslations("pages.app");
  const { workspaces } = useWorkspaceNavigation();
  const [isCreateWorkspaceDrawerOpen, setIsCreateWorkspaceDrawerOpen] = useState(false);

  return (
    <Container size="xl" className="space-y-8 pt-10 pb-24">
      <section className="max-w-3xl space-y-3">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-medium">{tApp("personal.eyebrow")}</p>
          <h1 className="font-heading text-3xl/[1.1] font-semibold tracking-tight text-pretty sm:text-4xl/[1.1]">
            {tApp("title")}
          </h1>
          <p className="text-muted-foreground text-sm text-pretty sm:text-base">
            {tApp("description")}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {appHomeCards.map((card) => {
          const CardIcon = card.icon;

          return (
            <Card key={card.key}>
              <CardHeader>
                <div className="bg-muted flex size-10 items-center justify-center rounded-md">
                  <CardIcon aria-hidden="true" className="size-5" />
                </div>
                <CardTitle>{tApp(`cards.${card.key}.title`)}</CardTitle>
                <CardDescription>{tApp(`cards.${card.key}.description`)}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button nativeButton={false} render={<Link href={card.href} />}>
                  {tApp(`cards.${card.key}.cta`)}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </section>

      <section>
        <Card className="gap-5">
          <CardHeader>
            <div className="bg-muted flex size-10 items-center justify-center rounded-md">
              <UsersIcon aria-hidden="true" className="size-5" />
            </div>
            <CardTitle>{tApp("workspace.title")}</CardTitle>
            <CardDescription>{tApp("workspace.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workspaces.length === 0 ? (
              <div className="bg-muted/40 rounded-lg border px-4 py-3">
                <p className="font-medium">{tApp("workspace.empty.title")}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {tApp("workspace.empty.description")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="font-medium">{tApp("workspace.list.title")}</p>
                  <p className="text-muted-foreground text-sm">
                    {tApp("workspace.list.description")}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {workspaces.map((workspace) => (
                    <div
                      key={workspace.id}
                      className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{workspace.name}</p>
                        <p className="text-muted-foreground truncate text-sm">{workspace.slug}</p>
                      </div>
                      <Button
                        nativeButton={false}
                        size="sm"
                        variant="ghost"
                        render={
                          <Link
                            href={{
                              pathname: "/w/[workspaceSlug]/overview",
                              params: {
                                workspaceSlug: workspace.slug,
                              },
                            }}
                          />
                        }
                      >
                        {tApp("workspace.list.cta")}
                        <ArrowRightIcon aria-hidden="true" className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => setIsCreateWorkspaceDrawerOpen(true)}>
              {tApp("workspace.create")}
            </Button>
          </CardFooter>
        </Card>
      </section>

      <WorkspaceCreateDrawer
        open={isCreateWorkspaceDrawerOpen}
        onOpenChange={setIsCreateWorkspaceDrawerOpen}
      />
    </Container>
  );
}
