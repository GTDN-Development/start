import { socialMediaLinksArray } from "@/config/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SocialMediaIcons(props: React.ComponentProps<"ul">) {
  return (
    <ul {...props} className={cn("flex flex-wrap gap-3", props.className)}>
      {socialMediaLinksArray.map((item) => (
        <li key={item.href}>
          <Button
            size="icon-lg"
            variant="ghost"
            nativeButton={false}
            render={<a href={item.href} target="_blank" rel="noopener noreferrer" />}
          >
            <span className="sr-only">{item.name}</span>
            <item.icon aria-hidden="true" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
