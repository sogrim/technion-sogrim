import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { GoogleClinetSession } from "../../types/auth-types";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID!;
console.log("nisso", GOOGLE_CLIENT_ID);

export default function GoogleAuth() {
  const [gsiScriptLoaded, setGsiScriptLoaded] = useState(false);
  const { setGoogleSession, setCredential } = useAuth();

  useEffect(() => {
    if (gsiScriptLoaded) return;

    const handleGoogleSignIn = (res: CredentialResponse) => {
      if (res.credential) {
        setCredential(res);
      }
      setGoogleSession(GoogleClinetSession.DONE);
    };

    const initializeGsi = () => {
      if (!window.google || gsiScriptLoaded) return;

      setGsiScriptLoaded(true);
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        auto_select: true,
        callback: handleGoogleSignIn,
      });
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
    };
  }, [gsiScriptLoaded, setCredential, setGoogleSession]);

  return (
    <>
      <div id="g_id_onload" data-client_id={GOOGLE_CLIENT_ID}></div>
    </>
  );
}
