import clsx from "clsx";
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
import { FloatingBar, type FloatingBarProps } from "@/components/ui/floating-bar";
import { Link } from "@/components/ui//link";
import { Container } from "@/components/ui/container";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export function Header({
  position = "sticky",
  autoHide = true,
  narrow = false,
  ...props
}: FloatingBarProps & {
  narrow?: boolean;
}) {
  return (
    <FloatingBar
      {...props}
      as="header"
      position={position}
      autoHide={autoHide}
      className={clsx(
        // Base styles for the navbar
        "z-100 h-(--navbar-height,64px) w-full",
        // Transition and initial state
        "transform-gpu transition duration-300",
        // Initial state
        "bg-tansparent",
        // Scrolled state - when the user starts scrolling
        "data-scrolled:bg-background/75 data-scrolled:shadow-lg data-scrolled:shadow-gray-950/2.5 data-scrolled:backdrop-blur-2xl",
        "dark:data-scrolled:shadow-none",
        // Hidden state for auto-hide behavior
        "data-hidden:data-scrolled:shadow-none data-hidden:motion-safe:-translate-y-full",
        props.className
      )}
    >
      <Container
        size={narrow ? "default" : "fluid"}
        className="flex h-full items-center justify-between gap-8"
      >
        {/* Left side */}
        <div className="flex flex-1 items-center gap-4">
          <Link href="/" aria-label="Home Page">
            <Logo aria-hidden="true" className="w-20" />
          </Link>
        </div>

        {/* Right side */}
        <div className="flex flex-1 items-center justify-end gap-4">
          <nav className="ml-auto hidden lg:block">Primary nav</nav>

          {/* Mobile menu */}
          <div className="lg:hidden">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="secondary" size="icon" aria-label="open menu">
                  <MenuIcon aria-hidden="true" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                  <DrawerHeader>
                    <DrawerTitle>Move Goal</DrawerTitle>
                    <DrawerDescription>Set your daily activity goal.</DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4 pb-0">Primary nav</div>
                  <DrawerFooter>
                    <Button>Submit</Button>
                    <DrawerClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </Container>
    </FloatingBar>
  );
}
