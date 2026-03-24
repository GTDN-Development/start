"use client";

import { Container } from "@/components/ui/container";
import { LoadingState } from "@/components/ui/loading-state";
import { ApplicationPageShell } from "@/features/application/application-page-shell";

export default function Loading() {
  return (
    <ApplicationPageShell variant="account" className="grid">
      <Container size="xl" className="h-full pt-10 pb-24">
        <LoadingState className="h-full min-h-96" />
      </Container>
    </ApplicationPageShell>
  );
}
