import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-success text-success-foreground shadow",
        warning: "border-transparent bg-warning text-warning-foreground shadow",
        "success-muted": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-transparent",
        "destructive-outline": "border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 bg-transparent",
        "info-outline": "border-blue-400 text-blue-500 dark:border-blue-600 dark:text-blue-400 bg-transparent",
        "muted-outline": "border-border text-muted-foreground bg-transparent",
        "success-outline": "border-green-500 text-green-600 dark:border-green-600 dark:text-green-400 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
