import { FileQuestion } from "lucide-react";

export function NotFoundView({
  title = "Not found",
  body = "The page you're looking for doesn't exist.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-16 text-center">
      <FileQuestion className="size-6 text-muted-foreground" />
      <div className="text-base font-semibold">{title}</div>
      <p className="max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
