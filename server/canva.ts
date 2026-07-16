import crypto from "crypto";
import type { Request } from "express";

const AUTHORIZE_URL = "https://www.canva.com/api/oauth/authorize";
const TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token";
const API_BASE = "https://api.canva.com/rest/v1";
const SCOPES = "asset:read folder:read";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export class CanvaConfigError extends Error {}
export class CanvaApiError extends Error {}

interface PendingAuth {
  codeVerifier: string;
  createdAt: number;
}

// Short-lived PKCE state, cleared as it's consumed or expires. A DB table
// would be overkill for a value that only needs to live for the few
// seconds of a browser redirect round-trip.
const pendingAuthByState = new Map<string, PendingAuth>();

function pruneExpiredState() {
  const cutoff = Date.now() - OAUTH_STATE_TTL_MS;
  pendingAuthByState.forEach((entry, state) => {
    if (entry.createdAt < cutoff) pendingAuthByState.delete(state);
  });
}

export function getCanvaCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new CanvaConfigError(
      "CANVA_CLIENT_ID and CANVA_CLIENT_SECRET must be set to use the Canva integration"
    );
  }
  return { clientId, clientSecret };
}

// Prefer an explicit override (useful behind proxies that terminate TLS
// before Express sees the request) and fall back to the request's own host.
export function resolveRedirectUri(req: Request): string {
  if (process.env.CANVA_REDIRECT_URI) return process.env.CANVA_REDIRECT_URI;
  return `${req.protocol}://${req.get("host")}/api/canva/oauth/callback`;
}

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

export function beginAuthorization(redirectUri: string): { url: string; state: string } {
  pruneExpiredState();
  const { clientId } = getCanvaCredentials();

  const codeVerifier = base64url(crypto.randomBytes(64));
  const codeChallenge = base64url(crypto.createHash("sha256").update(codeVerifier).digest());
  const state = base64url(crypto.randomBytes(24));

  pendingAuthByState.set(state, { codeVerifier, createdAt: Date.now() });

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  return { url: `${AUTHORIZE_URL}?${params.toString()}`, state };
}

export function consumePendingAuth(state: string): PendingAuth | undefined {
  const entry = pendingAuthByState.get(state);
  if (entry) pendingAuthByState.delete(state);
  return entry;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

async function postToken(body: URLSearchParams): Promise<TokenResponse> {
  const { clientId, clientSecret } = getCanvaCredentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(clientId, clientSecret),
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new CanvaApiError(`Canva token request failed (${res.status}): ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

export function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<TokenResponse> {
  return postToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    })
  );
}

export function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  return postToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    })
  );
}

async function canvaApiGet(path: string, accessToken: string): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new CanvaApiError(`Canva API request to ${path} failed (${res.status}): ${text}`);
  }
  return await res.json();
}

export function listFolderItems(
  accessToken: string,
  folderId: string,
  continuation?: string
): Promise<any> {
  const params = new URLSearchParams({ item_types: "image,folder" });
  if (continuation) params.set("continuation", continuation);
  return canvaApiGet(`/folders/${encodeURIComponent(folderId)}/items?${params.toString()}`, accessToken);
}

export function getAsset(accessToken: string, assetId: string): Promise<any> {
  return canvaApiGet(`/assets/${encodeURIComponent(assetId)}`, accessToken);
}

export async function downloadBinary(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new CanvaApiError(`Failed to download Canva asset content (${res.status})`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: res.headers.get("content-type") || "application/octet-stream",
  };
}
