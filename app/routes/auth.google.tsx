import { redirect } from "react-router";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured in the environment.");
  }

  const redirectUri = `${url.protocol}//${url.host}/auth/google/callback`;
  const scope = "email profile";
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
  
  return redirect(googleAuthUrl);
}
