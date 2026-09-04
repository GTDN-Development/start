import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FaqItem = {
  id?: string;
  question: string;
  answer: string;
};

const defaultFaqData: FaqItem[] = [
  {
    id: "getting-started",
    question: "How do I get started?",
    answer:
      "Sign up for a free account and follow the onboarding steps. You'll be up and running in minutes — no credit card required.",
  },
  {
    id: "available-plans",
    question: "What plans are available?",
    answer:
      "We offer a free tier and paid plans for teams and enterprises. You can upgrade, downgrade, or cancel at any time from your account settings.",
  },
  {
    id: "data-security",
    question: "Is my data secure?",
    answer:
      "Yes. All data is encrypted in transit and at rest. We are SOC 2 compliant and regularly undergo third-party security audits.",
  },
  {
    id: "invite-team",
    question: "Can I invite my team?",
    answer:
      "Absolutely. You can invite unlimited teammates on paid plans. Each member gets their own login and you control their permissions.",
  },
  {
    id: "free-trial",
    question: "Do you offer a free trial?",
    answer:
      "Yes, <br/> all paid plans come with a 14-day free trial. No credit card is needed to start the trial.",
  },
  {
    id: "cancel-subscription",
    question: "How do I cancel my subscription?",
    answer:
      "You can <strong>cancel at any time</strong> from your billing settings. Your access continues until the end of the current billing period.",
  },
];

export function Faq({
  faqData,
  ...props
}: { faqData?: FaqItem[] } & Omit<React.ComponentProps<"div">, "children">) {
  const items = faqData ?? defaultFaqData;

  return (
    <div {...props}>
      <Accordion>
        {items.map((item) => {
          const itemId = item.id ?? item.question;

          return (
            <AccordionItem key={itemId} value={itemId}>
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <div
                  className="typeset typeset-docs max-w-[37em]"
                  dangerouslySetInnerHTML={{ __html: item.answer }}
                />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

export type { FaqItem };
