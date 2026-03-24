import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface SheetProps {
  open: boolean
  onClose: () => void
  side?: "left" | "right"
  children: React.ReactNode
  className?: string
}

export function Sheet({ open, onClose, side = "right", children, className }: SheetProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div
        className={cn(
          "fixed inset-y-0 z-50 flex w-72 flex-col bg-background shadow-lg transition-transform duration-300",
          side === "right" ? "end-0" : "start-0",
          className
        )}
      >
        <button onClick={onClose} className="absolute top-4 end-4 opacity-70 hover:opacity-100">
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </>
  )
}
