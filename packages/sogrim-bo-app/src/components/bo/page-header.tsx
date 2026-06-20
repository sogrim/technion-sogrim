import type { ReactNode } from "react";
import { CopyButton } from "./copy-button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional id shown with a copy button (e.g. the record's id). */
  id?: string;
  /** Slot above the title — typically a back link / breadcrumb. */
  breadcrumb?: ReactNode;
  /** Slot on the trailing side — e.g. future action buttons. */
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, id, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="space-y-1">
      {breadcrumb}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          {id && (
            <div dir="ltr" className="mt-1 flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <span className="break-all">{id}</span>
              <CopyButton value={id} className="size-5" />
            </div>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
