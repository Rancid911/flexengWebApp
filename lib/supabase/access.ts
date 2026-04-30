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
  linkedActorScope: {
    mode: "privileged",
    rationale: "Linked actor derivation is the only allowed request-context exception that may use service-role while schema lacks an equivalent RLS-safe resolver."
  }
} satisfies Record<string, QueryAccessPolicy>;

export const REQUEST_ACCESS_MATRIX = {
  user_scoped: [
    "progress",
    "practice",
    "homework",
    "words",
    "payments/queries",
    "notifications/server",
    "self-service settings/profile"
  ],
  privileged: [
    "admin CRUD",
    "staff payments control",
    "teacher/staff schedule mutations",
    "teacher workspace cross-user reads",
    "request-context linked actor derivation"
  ],
  aggregate: [
    "admin dashboard metrics",
    "payments-control summaries",
    "search document candidate generation",
    "batch billing summaries"
  ]
} as const;

export const SERVICE_ROLE_EXCEPTION_LIST = [
  "lib/auth/request-context.ts: linked actor derivation remains privileged until a safe RLS/RPC alternative exists",
  "lib/schedule/queries.ts: schedule lookups and mutations are still privileged and need a later domain refactor",
  "lib/teacher-workspace/queries.ts: teacher workspace cross-user reads remain privileged pending a deeper decomposition",
  "lib/search/sources/search-documents.ts: search candidate aggregation remains aggregate/service-role by design"
] as const;
