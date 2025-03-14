import * as React from "react"

import { cn } from "@/lib/utils"

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {}

const Code = React.forwardRef<HTMLPreElement, CodeProps>(
  ({ className, ...props }, ref) => {
    return (
      <pre
        ref={ref}
        className={cn(
          "mb-4 mt-6 max-h-[650px] overflow-x-auto rounded-lg border bg-zinc-950 py-4 dark:bg-zinc-900",
          className
        )}
        {...props}
      />
    )
  }
)
Code.displayName = "Code"

export { Code } 