import { GoogleSignInButton } from "./google-auth";
import { Logo } from "@/components/common/logo";

export function AnonymousPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <div className="flex flex-col items-center text-center space-y-4">
        <Logo variant="stacked" className="h-56 w-auto" />
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
