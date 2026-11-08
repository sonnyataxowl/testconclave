import { describe, expect, it } from "vitest";
import { buildSignInUrl } from "./sign-in";

describe("buildSignInUrl", () => {
  it("appends an absolute /callback redirect_url", () => {
    const out = new URL(
      buildSignInUrl("https://login.example.com/login/client_x", "https://app.example.com"),
    );
    expect(out.origin + out.pathname).toBe("https://login.example.com/login/client_x");
    expect(out.searchParams.get("redirect_url")).toBe("https://app.example.com/callback");
  });
});
