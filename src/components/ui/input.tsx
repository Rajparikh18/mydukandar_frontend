import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-2xl border border-slate-200/90 bg-white/85 px-4 py-2 text-base shadow-sm transition-all outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-slate-400 focus-visible:border-emerald-300 focus-visible:ring-4 focus-visible:ring-emerald-500/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-100/70 disabled:opacity-50 aria-invalid:border-rose-300 aria-invalid:ring-4 aria-invalid:ring-rose-500/10 md:text-sm dark:bg-slate-900/30 dark:border-white/10 dark:placeholder:text-slate-500",
        className
      )}
      {...props}
    />
  )
}

export { Input }
