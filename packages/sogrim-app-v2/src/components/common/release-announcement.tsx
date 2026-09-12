import { useState } from "react";
import { CURRENT_RELEASE } from "@/data/release-notes";
import { Logo } from "@/components/common/logo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STORAGE_KEY = "sogrim-last-seen-version";

function hasUnseenRelease(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== CURRENT_RELEASE.version;
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== "SecurityError") {
      throw error;
    }
    console.warn(
      "Cannot read the last seen release: browser storage is blocked.",
      error,
    );
    return true;
  }
}

export function ReleaseAnnouncement() {
  const [open, setOpen] = useState(hasUnseenRelease);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      try {
        localStorage.setItem(STORAGE_KEY, CURRENT_RELEASE.version);
      } catch (error) {
        if (
          !(error instanceof DOMException) ||
          (error.name !== "SecurityError" &&
            error.name !== "QuotaExceededError")
        ) {
          throw error;
        }
        console.warn(
          "Cannot save the last seen release; the announcement may reappear on reload.",
          error,
        );
      }
    }
    setOpen(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        dir="rtl"
        className="w-[calc(100%-2rem)] max-w-md rounded-xl"
      >
        <DialogHeader>
          <Logo variant="icon" className="mb-2 h-8 w-auto self-start" />
          <DialogTitle>
            חדש בגרסה <bdi>{CURRENT_RELEASE.version}</bdi>
          </DialogTitle>
          <DialogDescription>
            {CURRENT_RELEASE.changes.map((change) => (
              <span key={change} className="block">
                {change}
              </span>
            ))}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
