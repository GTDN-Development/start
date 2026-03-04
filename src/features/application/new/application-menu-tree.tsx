import { cn } from "@/lib/utils";

export function ApplicationMenuTree(props: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "bg-destructive/20 flex h-300 w-full items-center justify-center",
        props.className
      )}
    >
      <div className="text-xl font-bold">Menu tree</div>
    </div>
  );
}
