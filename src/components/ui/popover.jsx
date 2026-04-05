import * as React from "react"
import { Popover as BasePopover } from "@base-ui/react"

import { cn } from "@/lib/utils"

const Popover = BasePopover.Root

const PopoverTrigger = BasePopover.Trigger

// BaseUI's Trigger acts as the anchor by default, but it doesn't have an explicit Anchor component.
// We provide a dummy component to not break existing imports if they used Anchor explicitly,
// but typically Anchor isn't strictly needed or maps to a custom positioned trigger.
const PopoverAnchor = React.forwardRef((props, ref) => <div ref={ref} {...props} />)

const PopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <BasePopover.Portal>
    <BasePopover.Positioner sideOffset={sideOffset} alignment={align}>
      <BasePopover.Popup
        ref={ref}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[starting-style]:animate-in data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[starting-style]:fade-in-0 data-[ending-style]:zoom-out-95 data-[starting-style]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props} />
    </BasePopover.Positioner>
  </BasePopover.Portal>
))
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
