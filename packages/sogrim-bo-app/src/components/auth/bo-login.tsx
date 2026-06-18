import { ShieldCheck } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BoLogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <ShieldCheck className="mb-2 size-8" style={{ color: "var(--banner)" }} />
          <CardTitle className="text-xl">Sogrim Back Office</CardTitle>
          <CardDescription>
            Sign in with your authorized Google account. Access is limited to administrators
            and enforced on the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <GoogleSignInButton />
          <p className="text-center text-xs text-muted-foreground">View-only console</p>
        </CardContent>
      </Card>
    </div>
  );
}
