import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createPageMetadata } from "@/lib/metadata";
import { AccountPage } from "@/components/platform/account/account-page";
import {
  AccountItem,
  AccountItemContent,
  AccountItemContentBody,
  AccountItemContentHeader,
  AccountItemDescription,
  AccountItemFooter,
  AccountItemTitle,
} from "@/components/platform/account/account-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export async function generateMetadata(props: PageProps<"/[locale]/account">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.account",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/account",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/account">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return (
    <AccountPage>
      <div className="space-y-10 pb-16">
        <AccountItem>
          <AccountItemContent className="flex flex-row flex-wrap gap-6 xl:gap-8">
            <AccountItemContentHeader className="w-full grow basis-72">
              <AccountItemTitle>Avatar</AccountItemTitle>
              <AccountItemDescription>
                Click on the avatar to upload a custom one from your files or delete existing one.
                Setting up custom avatar is optional, but recommended.
              </AccountItemDescription>
            </AccountItemContentHeader>
            <AccountItemContentBody className="shrink-0 basis-20">
              <Avatar className="size-20">
                <AvatarFallback>FB</AvatarFallback>
              </Avatar>
            </AccountItemContentBody>
          </AccountItemContent>
          <AccountItemFooter>
            <AccountItemDescription>
              Maximum size of your avatar image is 1 mb.
            </AccountItemDescription>
          </AccountItemFooter>
        </AccountItem>

        <AccountItem>
          <AccountItemContent className="flex flex-col gap-6">
            <AccountItemContentHeader>
              <AccountItemTitle>Display name</AccountItemTitle>
              <AccountItemDescription>Please enter your full name.</AccountItemDescription>
            </AccountItemContentHeader>
            <AccountItemContentBody>
              <Input className="max-w-sm" />
            </AccountItemContentBody>
          </AccountItemContent>
          <AccountItemFooter>
            <AccountItemDescription>Please use 32 characters at maximum.</AccountItemDescription>
            <Button size="lg">Save</Button>
          </AccountItemFooter>
        </AccountItem>

        <AccountItem>
          <AccountItemContent className="flex flex-col gap-6">
            <AccountItemContentHeader>
              <AccountItemTitle>E-mail</AccountItemTitle>
              <AccountItemDescription>
                The email address associated with your account. This email is used for log in and
                account-related notifications.
              </AccountItemDescription>
            </AccountItemContentHeader>
            <AccountItemContentBody>
              <p className="text-foreground font-semibold">user-email@gmail.com</p>
            </AccountItemContentBody>
          </AccountItemContent>
          <AccountItemFooter>
            <AccountItemDescription>
              Emails must be verified to be able to use it with your account.
            </AccountItemDescription>
            <Button size="lg">Edit e-mail</Button>
          </AccountItemFooter>
        </AccountItem>

        <AccountItem variant="destructive">
          <AccountItemContent>
            <AccountItemContentHeader>
              <AccountItemTitle>Delete account</AccountItemTitle>
              <AccountItemDescription>
                Permanently remove your Personal Account and all of its contents from our platform.
                This action is not reversible, so please continue with caution.
              </AccountItemDescription>
            </AccountItemContentHeader>
          </AccountItemContent>
          <AccountItemFooter className="sm:justify-end">
            <Button variant={"destructive"} size="lg">
              Permanently delete account
            </Button>
          </AccountItemFooter>
        </AccountItem>
      </div>
    </AccountPage>
  );
}
