import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "../../lib/utils"

// 1. Added "indicatorClassName" to the list of props here
const Progress = React.forwardRef(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-4 w-full overflow-hidden rounded-full bg-slate-200", className)}
    {...props}>
    <ProgressPrimitive.Indicator
      // 2. Used the "cn" utility to merge the default color with your new prop
      className={cn("h-full w-full flex-1 bg-blue-600 transition-all", indicatorClassName)}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }