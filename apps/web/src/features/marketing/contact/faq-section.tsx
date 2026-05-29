import { cn } from "@/lib/utils";
import { Faq, type FaqItem } from "./faq";

export function FaqSection({
  faqData,
  className,
  ...props
}: { faqData?: FaqItem[] } & React.ComponentProps<"div">) {
  return (
    <div className={cn("grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12", className)} {...props}>
      <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl md:sticky md:top-18 md:self-start">
        Frequently Asked Questions
      </h2>
      <div className="md:col-span-2">
        <Faq faqData={faqData} />
      </div>
    </div>
  );
}
