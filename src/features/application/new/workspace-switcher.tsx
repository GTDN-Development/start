import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";

export function WorkspaceSwitcher() {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="group/workspace-switcher grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 py-1">
          <Avatar size="sm">
            <AvatarFallback>WS</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 items-center justify-start">
            <span className="block truncate text-sm">Workspace Name</span>
          </div>
          <div className="group-hover/workspace-switcher:bg-muted rounded-sm p-1.5">
            <ChevronsUpDownIcon aria-hidden="true" className="ml-auto size-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Avatar size="sm">
                <AvatarFallback>1</AvatarFallback>
              </Avatar>
              My awesome workspace 1
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Avatar size="sm">
                <AvatarFallback>2</AvatarFallback>
              </Avatar>
              My awesome workspace 2
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Avatar size="sm">
                <AvatarFallback>2</AvatarFallback>
              </Avatar>
              My awesome workspace 2
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <PlusIcon />
            Create new workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
