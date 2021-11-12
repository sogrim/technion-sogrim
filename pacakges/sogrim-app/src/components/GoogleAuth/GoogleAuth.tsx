import jwtDecode from "jwt-decode"
import { useEffect, useState } from "react"
import { useAuth } from "../../hooks/useAuth";

export default function GoogleAuth() {
  const [gsiScriptLoaded, setGsiScriptLoaded] = useState(false)

   const { setCredential } = useAuth();
    
  useEffect(() => {      
    if (gsiScriptLoaded) return;

    const handleGoogleSignIn = (res: CredentialResponse) => {        
      console.log(res);

      if (res.credential) {
          setCredential(res);
          const user = jwtDecode(res.credential);
          console.log(user);                
      }
    }

    const initializeGsi = () => {      
      if (!window.google || gsiScriptLoaded) return;

      setGsiScriptLoaded(true)
      window.google.accounts.id.initialize({
        client_id: '646752534395-ptsuv4l9b4vojdad2ruussj6mo22fc86.apps.googleusercontent.com',
        auto_select: true,
        callback: handleGoogleSignIn,
        
      });
      window.google.accounts.id.renderButton(
        document.getElementById("buttonDiv")!, 
        { type: 'standard'},                
      );
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.onload = initializeGsi
    script.async = true
    script.id = "google-client-script"
    document.querySelector("body")?.appendChild(script)

    return () => {
      // Cleanup function that runs when component unmounts
      window.google?.accounts.id.cancel()
      document.getElementById("google-client-script")?.remove()
    }
    }, [ gsiScriptLoaded]);



    return <> 
        <div id="buttonDiv"></div>
        {/* <div id="g_id_onload"
          data-client_id='646752534395-ptsuv4l9b4vojdad2ruussj6mo22fc86.apps.googleusercontent.com'
          data-ux_mode="popup"
          onClick={handle}>
        </div> */}
        </>

}