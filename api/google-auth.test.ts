import { afterEach, describe, expect, it, vi } from "vitest";
import { buildGoogleAuthorizationUrl, googleAuthApp, isConfiguredGoogleAdmin } from "./google-auth";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Google authentication routes", () => {
  it("grants platform-admin eligibility only to the configured, verified email", () => {
    expect(isConfiguredGoogleAdmin("idibagroup2020@gmail.com", "IDIBAGROUP2020@gmail.com")).toBe(true);
    expect(isConfiguredGoogleAdmin("another@gmail.com", "idibagroup2020@gmail.com")).toBe(false);
    expect(isConfiguredGoogleAdmin("idibagroup2020@gmail.com", "not-an-email")).toBe(false);
  });

  it("suggests the configured Google account without restricting other accounts", () => {
    const url = buildGoogleAuthorizationUrl({
      clientId: "test-client.apps.googleusercontent.com",
      clientSecret: "test-secret",
      redirectUri: "https://app.example.com/api/auth/google/callback",
      appOrigin: "https://app.example.com",
    }, "state", "nonce", "verifier", "idibagroup2020@gmail.com");

    expect(url.searchParams.get("login_hint")).toBe("idibagroup2020@gmail.com");
    expect(url.searchParams.get("prompt")).toBe("select_account");
    expect(url.searchParams.has("hd")).toBe(false);
  });

  it("returns to login with an explicit message when OAuth is not configured", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    vi.stubEnv("GOOGLE_REDIRECT_URI", "");

    const response = await googleAuthApp.request("http://localhost/start");

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/login?auth=google_not_configured");
  });

  it("rejects callbacks that do not contain a valid browser-bound state", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-client.apps.googleusercontent.com");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-secret");
    vi.stubEnv("GOOGLE_REDIRECT_URI", "http://localhost:3000/api/auth/google/callback");

    const response = await googleAuthApp.request("http://localhost:3000/callback?state=invalid&code=example");

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?auth=google_failed");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("rejects insecure redirect URIs in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-client.apps.googleusercontent.com");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-secret");
    vi.stubEnv("GOOGLE_REDIRECT_URI", "http://localhost:3000/api/auth/google/callback");

    const response = await googleAuthApp.request("http://localhost:3000/start");

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/login?auth=google_not_configured");
  });
});
