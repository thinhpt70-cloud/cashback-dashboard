"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const Popover = React.forwardRef((
  {
    ...props
  },
  ref
) => {
  return <PopoverPrimitive.Root ref={ref} data-slot="popover" {...props} />;
});

Popover.displayName = "Popover";

const PopoverTrigger = React.forwardRef((
  {
    ...props
  },
  ref
) => {
  return <PopoverPrimitive.Trigger ref={ref} data-slot="popover-trigger" {...props} />;
});

PopoverTrigger.displayName = "PopoverTrigger";

const PopoverContent = React.forwardRef((
  {
    className,
    align = "center",
    sideOffset = 4,
    ...props
  },
  ref
) => {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 flex w-72 origin-(--radix-popover-content-transform-origin) flex-col gap-4 rounded-3xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/5 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props} />
    </PopoverPrimitive.Portal>
  );
});

PopoverContent.displayName = "PopoverContent";

const PopoverAnchor = React.forwardRef((
  {
    ...props
  },
  ref
) => {
  return <PopoverPrimitive.Anchor ref={ref} data-slot="popover-anchor" {...props} />;
});

PopoverAnchor.displayName = "PopoverAnchor";

const PopoverHeader = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <div
      ref={ref}
      data-slot="popover-header"
      className={cn("flex flex-col gap-1 text-sm", className)}
      {...props} />
  );
});

PopoverHeader.displayName = "PopoverHeader";

const PopoverTitle = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <div
      ref={ref}
      data-slot="popover-title"
      className={cn("font-heading text-base font-medium", className)}
      {...props} />
  );
});

PopoverTitle.displayName = "PopoverTitle";

const PopoverDescription = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <p
      ref={ref}
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props} />
  );
});

PopoverDescription.displayName = "PopoverDescription";

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
