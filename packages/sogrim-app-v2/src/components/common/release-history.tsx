import { CURRENT_RELEASE, RELEASE_HISTORY } from "@/data/release-notes";
import { Logo } from "@/components/common/logo";
import { badgeVariants } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ReleaseHistory() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={badgeVariants({
            variant: "outline",
            className: "cursor-pointer hover:bg-accent",
          })}
          aria-label={`היסטוריית עדכונים, גרסה ${CURRENT_RELEASE.version}`}
        >
          <bdi>{CURRENT_RELEASE.version}</bdi>
        </button>
      </DialogTrigger>
      <DialogContent
        dir="rtl"
        aria-describedby={undefined}
        className="w-[calc(100%-2rem)] max-w-lg rounded-xl"
      >
        <DialogHeader>
          <Logo variant="icon" className="mb-2 h-8 w-auto self-start" />
          <DialogTitle>היסטוריית עדכונים</DialogTitle>
        </DialogHeader>
        <ol className="max-h-[60dvh] space-y-5 overflow-y-auto">
          {RELEASE_HISTORY.map((release) => (
            <li
              key={release.version}
              className="space-y-2 border-b pb-5 last:border-b-0 last:pb-0"
            >
              <h3 className="text-sm font-semibold">
                גרסה <bdi>{release.version}</bdi>
              </h3>
              {release.changes.map((change) => (
                <p key={change} className="text-sm leading-relaxed text-muted-foreground">
                  {change}
                </p>
              ))}
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
