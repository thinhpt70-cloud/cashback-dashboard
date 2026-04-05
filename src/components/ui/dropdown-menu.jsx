import * as React from "react"
import { Menu as BaseMenu } from "@base-ui/react"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = BaseMenu.Root

const DropdownMenuTrigger = BaseMenu.Trigger

const DropdownMenuGroup = BaseMenu.Group

const DropdownMenuPortal = BaseMenu.Portal

const DropdownMenuSub = BaseMenu.SubmenuRoot

const DropdownMenuRadioGroup = BaseMenu.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => (
  <BaseMenu.SubmenuTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[popup-open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}>
    {children}
    <ChevronRight className="ml-auto" />
  </BaseMenu.SubmenuTrigger>
))
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger"

const DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => (
  <BaseMenu.Positioner className="z-50">
    <BaseMenu.Popup
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg transition-[opacity,transform] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[starting-style]:scale-95 duration-150",
        className
      )}
      {...props} />
  </BaseMenu.Positioner>
))
DropdownMenuSubContent.displayName = "DropdownMenuSubContent"

const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <BaseMenu.Portal>
    <BaseMenu.Positioner sideOffset={sideOffset} className="z-50">
      <BaseMenu.Popup
        ref={ref}
        className={cn(
          "z-50 max-h-[var(--available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md transition-[opacity,transform] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[starting-style]:scale-95 duration-150",
          className
        )}
        {...props} />
    </BaseMenu.Positioner>
  </BaseMenu.Portal>
))
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => (
  <BaseMenu.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props} />
))
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => (
  <BaseMenu.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}>
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <BaseMenu.CheckboxItemIndicator>
        <Check className="h-4 w-4" />
      </BaseMenu.CheckboxItemIndicator>
    </span>
    {children}
  </BaseMenu.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

const DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <BaseMenu.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}>
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <BaseMenu.RadioItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </BaseMenu.RadioItemIndicator>
    </span>
    {children}
  </BaseMenu.RadioItem>
))
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => (
  <BaseMenu.GroupLabel
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
    {...props} />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <BaseMenu.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props} />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuShortcut = ({
  className,
  ...props
}) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props} />
  );
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
