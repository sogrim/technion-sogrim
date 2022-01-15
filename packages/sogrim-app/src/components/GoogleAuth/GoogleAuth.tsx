import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { GoogleClinetSession } from "../../types/auth-types";

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
        client_id:
          "646752534395-ptsuv4l9b4vojdad2ruussj6mo22fc86.apps.googleusercontent.com",
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
      <div
        id="g_id_onload"
        data-client_id="646752534395-ptsuv4l9b4vojdad2ruussj6mo22fc86.apps.googleusercontent.com"
      ></div>
    </>
  );
}
