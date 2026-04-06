import * as React from "react"
import { cn } from "@/lib/utils"

const Skeleton = React.forwardRef((
  {
    className,
    ...props
  },
  ref
) => {
  return (
    <div
      ref={ref}
      data-slot="skeleton"
      className={cn("animate-pulse rounded-2xl bg-muted", className)}
      {...props} />
  );
});

Skeleton.displayName = "Skeleton";

export { Skeleton }
