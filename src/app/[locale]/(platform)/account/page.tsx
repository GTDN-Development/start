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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <AccountPage title="General" description="lorem ipsum dolor sit amet">
      <div className="space-y-12 pb-16">
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
              <DropdownMenu>
                <DropdownMenuTrigger
                  nativeButton={true}
                  render={
                    <button>
                      <Avatar className="size-20">
                        <AvatarFallback>FB</AvatarFallback>
                      </Avatar>
                    </button>
                  }
                />
                <DropdownMenuContent className={"w-auto"}>
                  <DropdownMenuItem className="pr-3 whitespace-nowrap">
                    <PencilIcon aria-hidden="true" />
                    Change Avatar
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" className="pr-3 whitespace-nowrap">
                    <Trash2Icon aria-hidden="true" />
                    Remove Avatar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <Input className="max-w-sm" placeholder={"User full name"} />
            </AccountItemContentBody>
          </AccountItemContent>
          <AccountItemFooter>
            <AccountItemDescription>Please use 32 characters at maximum.</AccountItemDescription>
            <Button size="lg">Save</Button>
          </AccountItemFooter>
        </AccountItem>

        <AccountItem>
          <AccountItemContent className="flex flex-col gap-6">
            <div className="flex flex-row flex-wrap gap-6 xl:gap-8">
              <AccountItemContentHeader className="w-full grow basis-72">
                <AccountItemTitle>E-mail</AccountItemTitle>
                <AccountItemDescription>
                  The email address associated with your account. This email is used for log in and
                  account-related notifications.
                </AccountItemDescription>
              </AccountItemContentHeader>
              <div className="shrink-0 basis-auto">
                {/* Note that here we should display only one badge based on the actual state */}
                <Badge className="bg-green-200 text-green-950 dark:bg-green-950 dark:text-green-300">
                  verified
                </Badge>
                <Badge variant="destructive">not-verified</Badge>
              </div>
            </div>
            <AccountItemContentBody>
              <p className="text-foreground font-semibold">user-email@gmail.com</p>
            </AccountItemContentBody>
          </AccountItemContent>
          <AccountItemFooter>
            <AccountItemDescription>
              Emails must be verified to be able to use it with your account.
            </AccountItemDescription>

            <Dialog>
              <DialogTrigger
                nativeButton={true}
                render={<Button size="lg">Edit account e-mail</Button>}
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change account email</DialogTitle>
                  <DialogDescription>
                    We&apos;ll send a verification link to the new address. Your current email
                    remains active until the change is confirmed.
                  </DialogDescription>
                </DialogHeader>

                <form action="" className="mt-4 flex flex-col gap-4">
                  <Field>
                    <FieldLabel>New email address</FieldLabel>
                    <Input type="email" autoComplete="email" required />
                  </Field>
                  <div className="flex flex-col gap-y-2">
                    <Field orientation="horizontal">
                      <Checkbox />
                      <div className="leading-none">
                        <FieldLabel>
                          I understand that the new email will gain access to your account
                        </FieldLabel>
                      </div>
                    </Field>
                    {/*{isInvalid && <FieldError errors={field.state.meta.errors} />}*/}
                  </div>
                </form>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline">Close</Button>} />
                  <Button>Send verification link</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
            <AlertDialog>
              <AlertDialogTrigger
                nativeButton={true}
                render={
                  <Button variant={"destructive"} size="lg">
                    Permanently delete account
                  </Button>
                }
              />
              <AlertDialogContent>
                <div className="flex items-start justify-start">
                  <div className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive rounded-sm p-2">
                    <Trash2Icon className="size-4" />
                  </div>
                </div>
                <AlertDialogHeader>
                  <AlertDialogTitle>Permanently delete account</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete this account and all associated data. This
                    action is not reversible, so please continue with caution.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel size={"lg"} variant="outline">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction size={"lg"} variant="destructive">
                    Delete permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </AccountItemFooter>
        </AccountItem>
      </div>
    </AccountPage>
  );
}
