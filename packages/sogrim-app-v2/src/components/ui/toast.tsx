import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface ToastProps {
  message: string
  type?: "default" | "error" | "success"
  onClose: () => void
}

export function Toast({ message, type = "default", onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

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
      <button onClick={onClose} className="opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
