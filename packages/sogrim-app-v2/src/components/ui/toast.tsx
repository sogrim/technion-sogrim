import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastProps {
  message: string
  type?: "default" | "error" | "success"
  onClose: () => void
  /** Optional inline action button rendered after the message. */
  action?: ToastAction
}

export function Toast({ message, type = "default", onClose, action }: ToastProps) {
  React.useEffect(() => {
    // Give actionable toasts more time so the user can read + click.
    const timer = setTimeout(onClose, action ? 10000 : 5000)
    return () => clearTimeout(timer)
  }, [onClose, action])

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg transition-all",
        type === "error" && "bg-red-50 text-red-700 border border-red-200",
        type === "success" && "bg-success text-success-foreground",
        type === "default" && "bg-card text-card-foreground border"
      )}
    >
      <span>{message}</span>
      {action && (
        <button
          onClick={() => {
            action.onClick()
            onClose()
          }}
          className="font-medium underline-offset-2 hover:underline focus:outline-none focus:underline whitespace-nowrap"
        >
          {action.label}
        </button>
      )}
      <button onClick={onClose} className="opacity-70 hover:opacity-100" aria-label="סגור">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
