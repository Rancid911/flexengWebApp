export type AccessMode = "user_scoped" | "privileged" | "aggregate";

export type QueryAccessPolicy = {
  mode: AccessMode;
  rationale: string;
};

export const REQUEST_CONTEXT_ACCESS_POLICIES = {
  minimal: {
    mode: "user_scoped",
    rationale: "Current-user auth/session lookup must use the SSR cookie-bound client and RLS."
  },
  profileIdentity: {
    mode: "user_scoped",
    rationale: "Current-user profile identity should resolve through the SSR cookie-bound client and RLS."
  },
  rbacActor: {
    mode: "user_scoped",
    rationale: "Current-user RBAC metadata should resolve through the SSR cookie-bound client and RBAC table RLS."
  },
  linkedActorScope: {
    mode: "user_scoped",
    rationale: "Current-user linked actor scope should resolve through the SSR cookie-bound client and the RLS-safe linked scope RPC."
  }
} satisfies Record<string, QueryAccessPolicy>;

export const REQUEST_ACCESS_MATRIX = {
  user_scoped: [
    "progress",
    "practice attempts service/repository + authenticated atomic RPC",
    "homework",
    "words service/repository",
    "payments service/repository",
    "notifications/server",
    "settings profile repository/gateways",
    "request-context actor repository"
  ],
  privileged: [
    "admin CRUD",
    "staff payments control"
  ],
  aggregate: [
    "admin dashboard metrics",
    "payments-control summaries",
    "search document candidate generation",
    "batch billing summaries"
  ]
} as const;

export const SERVICE_ROLE_EXCEPTION_LIST = [
  "lib/admin/audit.ts",
  "lib/admin/user.repository.ts",
  "lib/media/service.ts",
  "lib/payments/server.ts",
  "lib/supabase/admin.ts"
] as const;
