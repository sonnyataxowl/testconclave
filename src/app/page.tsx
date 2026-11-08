import { buildSignInUrl } from "@/lib/sign-in";

export default function Home() {
  const loginUrl = process.env.NEXT_PUBLIC_AXOWL_LOGIN_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const href = loginUrl && appUrl ? buildSignInUrl(loginUrl, appUrl) : undefined;

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-6 p-12">
      <h1 className="text-3xl font-semibold">Conclave</h1>
      <p className="text-center text-gray-600">
        Meet, record, and seal the recording.
      </p>
      {href ? (
        <a href={href} className="rounded bg-black px-4 py-2 text-white">
          Sign in
        </a>
      ) : (
        <p className="text-sm text-red-600">Sign-in is not configured.</p>
      )}
    </main>
  );
}
