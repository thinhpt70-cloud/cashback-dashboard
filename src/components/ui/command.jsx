"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon, Tick02Icon } from "@hugeicons/core-free-icons"

const Command = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <CommandPrimitive
      ref={ref}
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-4xl bg-popover p-1 text-popover-foreground",
        className
      )}
      {...props} />
  );
});

Command.displayName = "Command";

const CommandDialog = React.forwardRef((
  {
    title = "Command Palette",
    description = "Search for a command to run...",
    children,
    className,
    showCloseButton = false,
    ...props
  },
  ref
) => {
  return (
    <Dialog ref={ref} {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn("top-1/3 translate-y-0 overflow-hidden rounded-4xl! p-0", className)}
        showCloseButton={showCloseButton}>
        <Command>{children}</Command>
      </DialogContent>
    </Dialog>
  );
});

CommandDialog.displayName = "CommandDialog";

const CommandInput = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="h-9 bg-input/50">
        <CommandPrimitive.Input
          ref={ref}
          data-slot="command-input"
          className={cn(
            "w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props} />
        <InputGroupAddon>
          <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
});

CommandInput.displayName = "CommandInput";

const CommandList = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <CommandPrimitive.List
      ref={ref}
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
        className
      )}
      {...props} />
  );
});

CommandList.displayName = "CommandList";

const CommandEmpty = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <CommandPrimitive.Empty
      ref={ref}
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props} />
  );
});

CommandEmpty.displayName = "CommandEmpty";

const CommandGroup = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <CommandPrimitive.Group
      ref={ref}
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1.5 text-foreground **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props} />
  );
});

CommandGroup.displayName = "CommandGroup";

const CommandSeparator = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <CommandPrimitive.Separator
      ref={ref}
      data-slot="command-separator"
      className={cn("my-1.5 h-px bg-border/50", className)}
      {...props} />
  );
});

CommandSeparator.displayName = "CommandSeparator";

const CommandItem = React.forwardRef((
  {
    className,
    children,
    ...props
  },
  ref
) => {
  return (
    <CommandPrimitive.Item
      ref={ref}
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex cursor-default items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium outline-hidden select-none in-data-[slot=dialog-content]:rounded-3xl data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-foreground",
        className
      )}
      {...props}>
      {children}
      <HugeiconsIcon
        icon={Tick02Icon}
        strokeWidth={2}
        className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  );
});

CommandItem.displayName = "CommandItem";

const CommandShortcut = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <span
      ref={ref}
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground",
        className
      )}
      {...props} />
  );
});

CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
