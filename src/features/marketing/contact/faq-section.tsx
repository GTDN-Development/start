"use client";

import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type FaqItem = {
  question: string;
  answer: string;
};

const defaultFaqData: FaqItem[] = [
  {
    question: "How do I get started?",
    answer:
      "Sign up for a free account and follow the onboarding steps. You'll be up and running in minutes — no credit card required.",
  },
  {
    question: "What plans are available?",
    answer:
      "We offer a free tier and paid plans for teams and enterprises. You can upgrade, downgrade, or cancel at any time from your account settings.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. All data is encrypted in transit and at rest. We are SOC 2 compliant and regularly undergo third-party security audits.",
  },
  {
    question: "Can I invite my team?",
    answer:
      "Absolutely. You can invite unlimited teammates on paid plans. Each member gets their own login and you control their permissions.",
  },
  {
    question: "Do you offer a free trial?",
    answer:
      "Yes, all paid plans come with a 14-day free trial. No credit card is needed to start the trial.",
  },
  {
    question: "How do I cancel my subscription?",
    answer:
      "You can cancel at any time from your billing settings. Your access continues until the end of the current billing period.",
  },
];

export function FaqSection({
  faqData,
  className,
  ...props
}: { faqData?: FaqItem[] } & React.ComponentProps<"div">) {
  return (
    <div className={cn("grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12", className)} {...props}>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:sticky md:top-18 md:self-start">
        Frequently Asked Questions
      </h2>
      <div className="md:col-span-2">
        <Faq faqData={faqData} />
      </div>
    </div>
  );
}

function Faq({ faqData = defaultFaqData }: { faqData?: FaqItem[] } = {}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col">
      {faqData.map((faq, index) => (
        <Collapsible
          key={index}
          open={openIndex === index}
          onOpenChange={(open) => setOpenIndex(open ? index : null)}
        >
          <CollapsibleTrigger className={cn("hover:text-foreground/70 flex w-full items-center justify-between gap-4 py-4 text-left font-medium transition-colors", index !== 0 && "border-t")}>
            <span>{faq.question}</span>
            <ChevronDownIcon
              className={cn("size-4 shrink-0 transition-transform duration-200", openIndex === index && "rotate-180")}
              aria-hidden="true"
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="text-muted-foreground overflow-hidden">
            <p className="pb-4">{faq.answer}</p>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
