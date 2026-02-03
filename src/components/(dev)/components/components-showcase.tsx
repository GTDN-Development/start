import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Container } from "@/components/ui/container";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  SettingsIcon,
} from "lucide-react";

const buttonVariants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "link",
  "destructive",
] as const;

const buttonSizes = ["sm", "default", "lg", "icon", "icon-sm", "icon-lg"] as const;

export function ComponentsShowcase() {
  return (
    <div className="pb-24">
      <Container className="py-16">
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-wide">Dev Playground</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">UI Components</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            A quick visual checklist for the shadcn/ui components in this project. Use it to
            inspect variants, sizes, and accessibility states while building new screens.
          </p>
        </div>

        <section className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-3">
                {buttonVariants.map((variant) => (
                  <Button key={variant} variant={variant}>
                    {variant}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {buttonSizes.map((size) => (
                  <Button key={size} size={size} variant="outline">
                    {size.includes("icon") ? (
                      <ChevronRightIcon aria-hidden="true" className="size-4" />
                    ) : (
                      size
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="dev-input-text">Text</Label>
                <Input id="dev-input-text" name="dev-input-text" placeholder="Type something" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dev-input-email">Email</Label>
                <Input
                  id="dev-input-email"
                  name="dev-input-email"
                  type="email"
                  placeholder="you@email.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dev-input-disabled">Disabled</Label>
                <Input
                  id="dev-input-disabled"
                  name="dev-input-disabled"
                  placeholder="Disabled"
                  disabled
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dev-textarea">Textarea</Label>
                <Textarea
                  id="dev-textarea"
                  name="dev-textarea"
                  placeholder="Leave a note for the team..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Checkboxes & Switches</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Checkbox id="dev-checkbox" name="dev-checkbox" defaultChecked />
                <Label htmlFor="dev-checkbox">Remember this device</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="dev-switch" name="dev-switch" />
                <Label htmlFor="dev-switch">Enable notifications</Label>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Alert>
                <CheckCircleIcon aria-hidden="true" className="size-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Your changes were saved successfully.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTriangleIcon aria-hidden="true" className="size-4" />
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>Double-check the form fields and try again.</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </section>

        <section className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Menus & Dialogs</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Open menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">Delete workspace</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Dialog>
                <DialogTrigger asChild>
                  <Button>Simple dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share the update</DialogTitle>
                    <DialogDescription>
                      Send a quick note to the team about what changed.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="dev-dialog-message">Message</Label>
                    <Textarea
                      id="dev-dialog-message"
                      name="dev-dialog-message"
                      placeholder="Summarize the change..."
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button>Send update</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Details dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Workspace settings</DialogTitle>
                    <DialogDescription>
                      Update the environment without leaving the current screen.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="dev-dialog-name">Workspace name</Label>
                      <Input
                        id="dev-dialog-name"
                        name="dev-dialog-name"
                        defaultValue="Main workspace"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch id="dev-dialog-lock" name="dev-dialog-lock" />
                      <Label htmlFor="dev-dialog-lock">Lock settings</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="secondary">Save settings</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Destructive dialog</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this environment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The environment will be removed immediately.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </section>

        <section className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Drawer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline">
                    <SettingsIcon aria-hidden="true" className="size-4" />
                    Open drawer
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Quick settings</DrawerTitle>
                    <DrawerDescription>
                      Toggle environment settings without leaving the page.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="px-6">
                    <div className="flex items-center justify-between rounded-md border px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">Notifications</p>
                        <p className="text-muted-foreground text-sm">
                          Send updates to the workspace.
                        </p>
                      </div>
                      <Switch id="dev-drawer-notify" name="dev-drawer-notify" />
                    </div>
                  </div>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline">Close</Button>
                    </DrawerClose>
                    <Button>Save changes</Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </CardContent>
          </Card>
        </section>
      </Container>
    </div>
  );
}
