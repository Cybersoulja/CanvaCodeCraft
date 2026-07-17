// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Request } from "express";
import {
  getCanvaCredentials,
  CanvaConfigError,
  resolveRedirectUri,
  beginAuthorization,
  consumePendingAuth,
} from "./canva";

function fakeRequest(host: string, protocol = "http"): Request {
  return {
    protocol,
    get: (name: string) => (name.toLowerCase() === "host" ? host : undefined),
  } as unknown as Request;
}

function withEnv(keys: string[], fn: () => void) {
  const originals = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  afterEach(() => {
    for (const k of keys) {
      if (originals[k] === undefined) delete process.env[k];
      else process.env[k] = originals[k];
    }
  });
  fn();
}

describe("getCanvaCredentials", () => {
  withEnv(["CANVA_CLIENT_ID", "CANVA_CLIENT_SECRET"], () => {
    it("throws CanvaConfigError when CANVA_CLIENT_ID/SECRET are not set", () => {
      delete process.env.CANVA_CLIENT_ID;
      delete process.env.CANVA_CLIENT_SECRET;
      expect(() => getCanvaCredentials()).toThrow(CanvaConfigError);
    });

    it("returns the configured client id and secret", () => {
      process.env.CANVA_CLIENT_ID = "id-123";
      process.env.CANVA_CLIENT_SECRET = "secret-456";
      expect(getCanvaCredentials()).toEqual({ clientId: "id-123", clientSecret: "secret-456" });
    });
  });
});

describe("resolveRedirectUri", () => {
  withEnv(["CANVA_REDIRECT_URI"], () => {
    it("computes the redirect URI from the request when no override is set", () => {
      delete process.env.CANVA_REDIRECT_URI;
      const req = fakeRequest("localhost:5000");
      expect(resolveRedirectUri(req)).toBe("http://localhost:5000/api/canva/oauth/callback");
    });

    it("prefers CANVA_REDIRECT_URI when set, e.g. behind a TLS-terminating proxy", () => {
      process.env.CANVA_REDIRECT_URI = "https://example.com/api/canva/oauth/callback";
      const req = fakeRequest("localhost:5000");
      expect(resolveRedirectUri(req)).toBe("https://example.com/api/canva/oauth/callback");
    });
  });
});

describe("beginAuthorization", () => {
  withEnv(["CANVA_CLIENT_ID", "CANVA_CLIENT_SECRET"], () => {
    beforeEach(() => {
      process.env.CANVA_CLIENT_ID = "test-client-id";
      process.env.CANVA_CLIENT_SECRET = "test-client-secret";
    });

    it("builds a PKCE (S256) authorize URL with the required OAuth parameters", () => {
      const { url, state } = beginAuthorization("http://localhost:5000/api/canva/oauth/callback");
      const parsed = new URL(url);

      expect(parsed.origin + parsed.pathname).toBe("https://www.canva.com/api/oauth/authorize");
      expect(parsed.searchParams.get("client_id")).toBe("test-client-id");
      expect(parsed.searchParams.get("response_type")).toBe("code");
      expect(parsed.searchParams.get("redirect_uri")).toBe("http://localhost:5000/api/canva/oauth/callback");
      expect(parsed.searchParams.get("scope")).toBe("asset:read folder:read");
      expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
      expect(parsed.searchParams.get("state")).toBe(state);

      // SHA-256 digest, base64url-encoded without padding: always 43 characters.
      const challenge = parsed.searchParams.get("code_challenge")!;
      expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it("issues a fresh state per call so concurrent auth attempts don't collide", () => {
      const first = beginAuthorization("http://localhost:5000/api/canva/oauth/callback");
      const second = beginAuthorization("http://localhost:5000/api/canva/oauth/callback");
      expect(first.state).not.toBe(second.state);
    });

    it("lets a valid state be consumed exactly once", () => {
      const { state } = beginAuthorization("http://localhost:5000/api/canva/oauth/callback");
      expect(consumePendingAuth(state)).toBeDefined();
      expect(consumePendingAuth(state)).toBeUndefined();
    });

    it("rejects an unknown state", () => {
      expect(consumePendingAuth("never-issued")).toBeUndefined();
    });
  });
});
