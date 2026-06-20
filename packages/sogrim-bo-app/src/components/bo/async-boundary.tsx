import type { ReactNode } from "react";
import { Loader2, Lock, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isAuthorizationError } from "@/lib/api-errors";

interface AsyncBoundaryProps<T> {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  data: T | undefined;
  children: (data: T) => ReactNode;
  onRetry?: () => void;
  loadingLabel?: string;
}

function CenteredMessage({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-16 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <div className="text-base font-semibold">{title}</div>
      {body && <p className="max-w-md text-sm text-muted-foreground">{body}</p>}
      {action}
    </div>
  );
}

/** Renders the right state for an async (TanStack Query) result: loading,
 *  access-restricted (permission error), generic error, or the data. */
export function AsyncBoundary<T>({
  isLoading,
  isError,
  error,
  data,
  children,
  onRetry,
  loadingLabel = "Loading…",
}: AsyncBoundaryProps<T>) {
  if (isLoading) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"
      >
        <Loader2 className="size-4 animate-spin" />
        {loadingLabel}
      </div>
    );
  }

  if (isError) {
    if (isAuthorizationError(error)) {
      return (
        <CenteredMessage
          icon={<Lock className="size-6" />}
          title="Access restricted"
          body="Your account isn't authorized for the back office. Ask an owner to grant you the Admin role."
        />
      );
    }
    return (
      <CenteredMessage
        icon={<TriangleAlert className="size-6" />}
        title="Something went wrong"
        body="The data couldn't be loaded."
        action={
          onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (data !== undefined) {
    return <>{children(data)}</>;
  }

  return null;
}
