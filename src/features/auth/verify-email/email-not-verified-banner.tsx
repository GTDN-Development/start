"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { XIcon } from "lucide-react";

export function EmailNotVerifiedBanner() {
  return (
    <div className="bg-amber-600 py-2.5 text-amber-100">
      <Container className="flex items-center gap-2 lg:before:flex-1">
        <div className="flex w-full flex-wrap items-center gap-2 lg:justify-center lg:text-center">
          <p className="text-sm">
            <strong>Almost there! Please verify your email to unlock all features.</strong>
          </p>
          <Button variant="link" size="sm" className="text-amber-100">
            Resend verification email
          </Button>
        </div>

        <div className="flex flex-1 justify-end">
          <Button variant="ghost" size="icon-sm">
            <XIcon aria-hidden="true" />
          </Button>
        </div>
      </Container>
    </div>
  );
}
