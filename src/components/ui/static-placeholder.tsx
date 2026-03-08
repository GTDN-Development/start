import { cn } from "@/lib/utils";

export function StaticPlaceholder(props: Omit<React.HTMLAttributes<HTMLDivElement>, "children">) {
  return (
    <div {...props} className={cn("text-destructive text-sm", props.className)}>
      This is a static placeholder
    </div>
  );
}
