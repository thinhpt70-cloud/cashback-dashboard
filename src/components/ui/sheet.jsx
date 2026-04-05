import * as React from "react"
import { Dialog as BaseDialog } from "@base-ui/react"
import { cva } from "class-variance-authority";
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = BaseDialog.Root

const SheetTrigger = BaseDialog.Trigger

const SheetClose = BaseDialog.Close

const SheetPortal = BaseDialog.Portal

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <BaseDialog.Backdrop
    className={cn(
      "fixed inset-0 z-50 bg-black/80 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
      className
    )}
    {...props}
    ref={ref} />
))
SheetOverlay.displayName = "SheetOverlay"

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition-transform ease-in-out duration-300",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[ending-style]:-translate-y-full data-[starting-style]:-translate-y-full",
        bottom:
          "inset-x-0 bottom-0 border-t data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full rounded-t-xl sm:rounded-t-lg",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

const SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <BaseDialog.Popup ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
      <BaseDialog.Close
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </BaseDialog.Close>
      {children}
    </BaseDialog.Popup>
  </SheetPortal>
))
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props} />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props} />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <BaseDialog.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props} />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <BaseDialog.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
