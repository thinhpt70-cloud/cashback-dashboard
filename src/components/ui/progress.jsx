import * as React from "react"
import { Progress as BaseProgress } from "@base-ui/react"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <BaseProgress.Root
    ref={ref}
    value={value}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
      className
    )}
    {...props}>
    <BaseProgress.Track className="absolute inset-0">
      <BaseProgress.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
    </BaseProgress.Track>
  </BaseProgress.Root>
))
Progress.displayName = "Progress"

export { Progress }
