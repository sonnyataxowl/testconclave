/** Build the hosted-login URL, returning to `${appUrl}/callback` after sign-in. */
export function buildSignInUrl(loginUrl: string, appUrl: string): string {
  const url = new URL(loginUrl);
  url.searchParams.set("redirect_url", new URL("/callback", appUrl).toString());
  return url.toString();
}
