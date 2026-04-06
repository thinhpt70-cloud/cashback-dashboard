import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

const Drawer = React.forwardRef((
  {
    ...props
  },
  ref
) => {
  return <DrawerPrimitive.Root ref={ref} data-slot="drawer" {...props} />;
});

Drawer.displayName = "Drawer";

const DrawerTrigger = React.forwardRef((
  {
    ...props
  },
  ref
) => {
  return <DrawerPrimitive.Trigger ref={ref} data-slot="drawer-trigger" {...props} />;
});

DrawerTrigger.displayName = "DrawerTrigger";

const DrawerPortal = React.forwardRef((
  {
    ...props
  },
  ref
) => {
  return <DrawerPrimitive.Portal ref={ref} data-slot="drawer-portal" {...props} />;
});

DrawerPortal.displayName = "DrawerPortal";

const DrawerClose = React.forwardRef((
  {
    ...props
  },
  ref
) => {
  return <DrawerPrimitive.Close ref={ref} data-slot="drawer-close" {...props} />;
});

DrawerClose.displayName = "DrawerClose";

const DrawerOverlay = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <DrawerPrimitive.Overlay
      ref={ref}
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/30 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props} />
  );
});

DrawerOverlay.displayName = "DrawerOverlay";

const DrawerContent = React.forwardRef((
  {
    className,
    children,
    ...props
  },
  ref
) => {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content fixed z-50 flex h-auto flex-col bg-transparent p-4 text-sm before:absolute before:inset-2 before:-z-10 before:rounded-4xl before:border before:border-border before:bg-popover before:shadow-xl data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=left]:sm:max-w-sm data-[vaul-drawer-direction=right]:sm:max-w-sm",
          className
        )}
        {...props}>
        <div
          className="mx-auto mt-4 hidden h-1.5 w-[100px] shrink-0 rounded-full bg-muted group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
});

DrawerContent.displayName = "DrawerContent";

const DrawerHeader = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <div
      ref={ref}
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left",
        className
      )}
      {...props} />
  );
});

DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <div
      ref={ref}
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props} />
  );
});

DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <DrawerPrimitive.Title
      ref={ref}
      data-slot="drawer-title"
      className={cn("font-heading text-base font-medium text-foreground", className)}
      {...props} />
  );
});

DrawerTitle.displayName = "DrawerTitle";

const DrawerDescription = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <DrawerPrimitive.Description
      ref={ref}
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props} />
  );
});

DrawerDescription.displayName = "DrawerDescription";

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
