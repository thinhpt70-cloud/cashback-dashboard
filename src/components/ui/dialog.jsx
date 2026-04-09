"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

const Dialog = React.forwardRef((
  {
    ...props
  },
  ref
) => {
  return <DialogPrimitive.Root ref={ref} data-slot="dialog" {...props} />;
});

Dialog.displayName = "Dialog";

const DialogTrigger = React.forwardRef((
  {
    ...props
  },
  ref
) => {
  return <DialogPrimitive.Trigger ref={ref} data-slot="dialog-trigger" {...props} />;
});

DialogTrigger.displayName = "DialogTrigger";

const DialogPortal = React.forwardRef((
  {
    ...props
  },
  ref
) => {
  return <DialogPrimitive.Portal ref={ref} data-slot="dialog-portal" {...props} />;
});

DialogPortal.displayName = "DialogPortal";

const DialogClose = React.forwardRef((
  {
    ...props
  },
  ref
) => {
  return <DialogPrimitive.Close ref={ref} data-slot="dialog-close" {...props} />;
});

DialogClose.displayName = "DialogClose";

const DialogOverlay = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/30 duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props} />
  );
});

DialogOverlay.displayName = "DialogOverlay";

const DialogContent = React.forwardRef((
  {
    className,
    children,
    showCloseButton = true,
    ...props
  },
  ref
) => {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-4xl bg-popover p-6 text-sm text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100 outline-none sm:max-w-md dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}>
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-4 right-4 bg-secondary"
              size="icon-sm">
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <div
      ref={ref}
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props} />
  );
});

DialogHeader.displayName = "DialogHeader";

const DialogFooter = React.forwardRef((
  {
    className,
    showCloseButton = false,
    children,
    ...props
  },
  ref
) => {
  return (
    <div
      ref={ref}
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}>
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
});

DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <DialogPrimitive.Title
      ref={ref}
      data-slot="dialog-title"
      className={cn("font-heading text-base leading-none font-medium", className)}
      {...props} />
  );
});

DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <DialogPrimitive.Description
      ref={ref}
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props} />
  );
});

DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
