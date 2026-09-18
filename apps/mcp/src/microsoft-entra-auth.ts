import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTVerifyGetKey,
  type JWTPayload
} from "jose";

export type MicrosoftEntraAuthConfig = {
  allowedClientId: string;
  audience: string;
  jwksUrl?: string;
  requiredRole: string;
  tenantId: string;
  // Explicit, tenant-restricted pilot. Omission preserves app-only behavior.
  delegated?: { allowedClientId: string; requiredScope: string };
};

export type MicrosoftEntraClaims = JWTPayload & {
  appid?: string;
  azp?: string;
  roles: string[];
  tid: string;
};

export type MicrosoftEntraAuthResult =
  | { ok: true; claims: MicrosoftEntraClaims; clientId: string; tenantId: string;
      identity: { kind: "application" } | { kind: "delegated"; objectId: string } }
  | { ok: false; reason: "invalid_token" | "wrong_client" | "missing_role" | "missing_scope" };

export function microsoftEntraSessionBinding(auth: Extract<MicrosoftEntraAuthResult, { ok: true }>) {
  return auth.identity.kind === "application"
    ? `microsoft-entra:${auth.tenantId}:${auth.clientId}`
    : `microsoft-entra-delegated:${auth.tenantId}:${auth.clientId}:${auth.identity.objectId}`;
}

export type MicrosoftEntraTokenValidator = {
  verify(token: string): Promise<MicrosoftEntraAuthResult>;
};

export function microsoftEntraIssuer(tenantId: string) {
  return `https://login.microsoftonline.com/${tenantId}/v2.0`;
}

export function microsoftEntraJwksUrl(tenantId: string) {
  return `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`;
}

export function createMicrosoftEntraTokenValidator(
  config: MicrosoftEntraAuthConfig,
  options: { getKey?: JWTVerifyGetKey } = {}
): MicrosoftEntraTokenValidator {
  const getKey = options.getKey ?? createRemoteJWKSet(
    new URL(config.jwksUrl ?? microsoftEntraJwksUrl(config.tenantId)),
    {
      cacheMaxAge: 6 * 60 * 60 * 1000,
      cooldownDuration: 30_000,
      timeoutDuration: 5_000
    }
  );
  const issuer = microsoftEntraIssuer(config.tenantId);

  return {
    async verify(token) {
      try {
        const { payload } = await jwtVerify(token, getKey, {
          algorithms: ["RS256"],
          audience: config.audience,
          clockTolerance: 5,
          issuer,
          requiredClaims: ["exp", "iat", "tid", "ver"]
        });
        if (payload.tid !== config.tenantId || payload.ver !== "2.0") {
          return { ok: false, reason: "invalid_token" };
        }
        // Never fall back to application roles for a malformed/delegated token.
        if (payload.scp !== undefined) {
          if (!config.delegated || typeof payload.scp !== "string" || !payload.scp.trim()
            || payload.idtyp === "app" || typeof payload.oid !== "string"
            || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.oid)) {
            return { ok: false, reason: "invalid_token" };
          }
          if (payload.azp !== config.delegated.allowedClientId) {
            return { ok: false, reason: "wrong_client" };
          }
          if (!payload.scp.split(/\s+/).includes(config.delegated.requiredScope)) {
            return { ok: false, reason: "missing_scope" };
          }
          return {
            ok: true,
            claims: { ...payload, roles: [], tid: config.tenantId },
            clientId: config.delegated.allowedClientId,
            tenantId: config.tenantId,
            identity: { kind: "delegated", objectId: payload.oid.toLowerCase() }
          };
        }
        const clientId = typeof payload.azp === "string"
          ? payload.azp
          : typeof payload.appid === "string"
            ? payload.appid
            : null;
        if (clientId !== config.allowedClientId) {
          return { ok: false, reason: "wrong_client" };
        }
        const roles = Array.isArray(payload.roles)
          ? payload.roles.filter((role): role is string => typeof role === "string")
          : [];
        if (!roles.includes(config.requiredRole)) {
          return { ok: false, reason: "missing_role" };
        }
        return {
          ok: true,
          claims: { ...payload, roles, tid: config.tenantId },
          clientId,
          tenantId: config.tenantId,
          identity: { kind: "application" }
        };
      } catch {
        return { ok: false, reason: "invalid_token" };
      }
    }
  };
}
