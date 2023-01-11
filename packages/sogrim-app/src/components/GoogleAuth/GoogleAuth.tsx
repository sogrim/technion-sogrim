import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { GoogleClientSession } from "../../types/auth-types";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID!;

interface GoogleAuthProps {
  onLogin?: () => void;
}

export const GoogleAuth: React.FC<GoogleAuthProps> = ({ onLogin }) => {
  const [gsiScriptLoaded, setGsiScriptLoaded] = useState(false);
  const { setGoogleSession, setCredential } = useAuth();

  useEffect(() => {
    if (gsiScriptLoaded) return;

    const handleGoogleSignIn = (res: CredentialResponse) => {
      if (res.credential) {
        setCredential(res);
      }
      setGoogleSession(GoogleClientSession.DONE);
      onLogin && onLogin();
    };

    const initializeGsi = () => {
      if (!window.google || gsiScriptLoaded) return;

      setGsiScriptLoaded(true);
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        auto_select: true,
        callback: handleGoogleSignIn,
      });

      // Required for error boundary when token expires
      window.google.accounts.id.prompt((_) => {});

      window.google.accounts.id.renderButton(
        document.getElementById("google-button-div")!,
        { type: "standard" }
      );
    };

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = initializeGsi;
    script.async = true;
    script.id = "google-client-script";
    document.querySelector("body")?.appendChild(script);

    return () => {
      // Cleanup function that runs when component unmounts
      window.google?.accounts.id.cancel();
      document.getElementById("google-client-script")?.remove();
    };
  }, [gsiScriptLoaded, setCredential, setGoogleSession, onLogin]);

  return (
    <>
      <div id="g_id_onload" data-client_id={GOOGLE_CLIENT_ID}></div>
    </>
  );
};
