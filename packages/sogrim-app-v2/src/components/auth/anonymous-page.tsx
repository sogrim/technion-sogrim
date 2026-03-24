import { GoogleSignInButton } from "./google-auth";

export function AnonymousPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">סוגרים</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          מעקב תואר חכם לסטודנטים בטכניון
        </p>
      </div>
      <div className="flex flex-col items-center gap-4">
        <GoogleSignInButton />
        <p className="text-sm text-muted-foreground">
          התחבר עם חשבון Google כדי להתחיל
        </p>
      </div>
    </div>
  );
}
