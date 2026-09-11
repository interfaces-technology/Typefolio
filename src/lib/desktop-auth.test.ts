import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildDesktopCallbackUrl,
  isAllowedDesktopRedirectUri,
} from "./desktop-auth";

describe("isAllowedDesktopRedirectUri", () => {
  it("allows localhost macOS callbacks", () => {
    assert.equal(isAllowedDesktopRedirectUri("http://127.0.0.1:54321/callback"), true);
    assert.equal(isAllowedDesktopRedirectUri("http://localhost:8080/callback"), true);
  });

  it("allows iOS syncfont callbacks", () => {
    assert.equal(isAllowedDesktopRedirectUri("syncfont://auth/callback"), true);
  });

  it("rejects unsafe redirects", () => {
    assert.equal(isAllowedDesktopRedirectUri(""), false);
    assert.equal(isAllowedDesktopRedirectUri("https://evil.com/callback"), false);
    assert.equal(isAllowedDesktopRedirectUri("syncfont://evil/callback"), false);
    assert.equal(isAllowedDesktopRedirectUri("syncfont://auth/other"), false);
    assert.equal(isAllowedDesktopRedirectUri("http://example.com/callback"), false);
  });
});

describe("buildDesktopCallbackUrl", () => {
  it("appends token and email query params", () => {
    const url = buildDesktopCallbackUrl(
      "syncfont://auth/callback",
      "token-123",
      "user@example.com",
    );
    assert.equal(url, "syncfont://auth/callback?token=token-123&email=user%40example.com");
  });
});
