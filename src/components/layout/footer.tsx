import Link from "next/link";
import { chain } from "@/lib/utils";
import clsx from "clsx";
import { Logo } from "@/components/ui/logo";
import { ArrowUpIcon } from "lucide-react";
import { NavLink } from "@/components/ui/nav-link";
import { Container } from "@/components/ui/container";

export function Footer(props: React.ComponentProps<"footer">) {
  return (
    <footer {...props} className={clsx("border-t-border border-t", props.className)}>
      <Container>
        <div className="grid min-w-0 gap-16 py-16 lg:grid-cols-7 2xl:gap-32">
          {/* Brand section */}
          <div className="flex min-w-0 flex-col items-start justify-start gap-4 sm:gap-6 lg:col-span-2">
            <Link href="/" aria-label="Home Page">
              <Logo aria-hidden="true" className="w-20" />
            </Link>
            <ScrollToTopButton className="mt-auto" />
          </div>
        </div>

        {/* Metadata footer section */}
        <div className="border-t-border flex min-w-0 flex-wrap items-start justify-between gap-6 border-t py-12 sm:items-center">
          <Copyright company="gtdn.online" />
          <AgencyCredit />
        </div>
      </Container>
    </footer>
  );
}

function Copyright({
  company = "Your Company",
  ...props
}: Omit<React.ComponentProps<"p">, "children"> & {
  company?: string;
}) {
  return (
    <p {...props} className={clsx("text-text-subtle text-sm", props.className)}>
      Copyright &copy;&nbsp;{new Date().getFullYear()}&nbsp;{company}
    </p>
  );
}

function ScrollToTopButton(props: React.ComponentProps<"button">) {
  return (
    <button
      {...props}
      onClick={chain(props.onClick, () => window.scrollTo({ top: 0, behavior: "smooth" }))}
      className={clsx(
        "cursor-pointer text-sm underline decoration-current/20 decoration-1 underline-offset-2 hover:decoration-current/60",
        props.className
      )}
    >
      Scroll to top <ArrowUpIcon aria-hidden="true" className="ml-1 inline size-[1em]" />
    </button>
  );
}

function AgencyCredit(props: React.ComponentProps<"p">) {
  return (
    <p {...props} className={clsx("text-sm", props.className)}>
      <span>Created by </span>
      <NavLink
        href="https://www.gtdn.online/"
        className="underline decoration-current/20 decoration-1 underline-offset-2 hover:decoration-current/60"
        showExternalIcon
      >
        gtdn.online
      </NavLink>
    </p>
  );
}
