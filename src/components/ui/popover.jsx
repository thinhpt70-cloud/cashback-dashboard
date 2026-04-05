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
    <BasePopover.Positioner sideOffset={sideOffset} alignment={align} className="z-50">
      <BasePopover.Popup
        ref={ref}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none transition-[opacity,transform] duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[starting-style]:scale-95",
          className
        )}
        {...props} />
    </BasePopover.Positioner>
  </BasePopover.Portal>
))
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
