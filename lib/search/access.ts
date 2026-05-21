import type { SearchContext, SearchDocumentCandidate } from "@/lib/search/types";

type SearchPermissionRule = {
  permission: string;
  scopes?: string[];
};

const STAFF_CANDIDATE_EXPANSION_RULES: SearchPermissionRule[] = [
  { permission: "students.view", scopes: ["all"] },
  { permission: "students.manage", scopes: ["all"] },
  { permission: "student_progress.view", scopes: ["all"] },
  { permission: "content.manage", scopes: ["all"] },
  { permission: "crm.leads.view", scopes: ["all"] },
  { permission: "crm.leads.manage", scopes: ["all"] },
  { permission: "users.view", scopes: ["all"] },
  { permission: "users.manage", scopes: ["all"] },
  { permission: "teachers.view", scopes: ["all"] },
  { permission: "teachers.manage", scopes: ["all"] },
  { permission: "payments.view", scopes: ["all"] },
  { permission: "payments.manage", scopes: ["all"] },
  { permission: "notifications.manage", scopes: ["all"] },
  { permission: "word_cards.manage", scopes: ["all"] }
];

const ADMIN_SECTION_RULES: Array<SearchPermissionRule & { matches: (candidate: SearchDocumentCandidate) => boolean }> = [
  { permission: "students.view", scopes: ["all"], matches: (candidate) => candidate.href.startsWith("/admin/students") },
  { permission: "students.manage", scopes: ["all"], matches: (candidate) => candidate.href.startsWith("/admin/students") },
  { permission: "teachers.view", scopes: ["all"], matches: (candidate) => candidate.href.startsWith("/admin/teachers") },
  { permission: "teachers.manage", scopes: ["all"], matches: (candidate) => candidate.href.startsWith("/admin/teachers") },
  { permission: "payments.view", scopes: ["all"], matches: (candidate) => candidate.href.startsWith("/admin/payments") },
  { permission: "payments.manage", scopes: ["all"], matches: (candidate) => candidate.href.startsWith("/admin/payments") },
  { permission: "crm.leads.view", scopes: ["all"], matches: (candidate) => candidate.href.startsWith("/crm") },
  { permission: "crm.leads.manage", scopes: ["all"], matches: (candidate) => candidate.href.startsWith("/crm") },
  {
    permission: "notifications.manage",
    scopes: ["all"],
    matches: (candidate) => candidate.entityType.includes("notification") || candidate.href.startsWith("/admin/notifications")
  },
  {
    permission: "word_cards.manage",
    scopes: ["all"],
    matches: (candidate) => candidate.entityType.includes("word") || candidate.href.includes("word-card")
  },
  {
    permission: "content.manage",
    scopes: ["all"],
    matches: (candidate) =>
      candidate.href.startsWith("/admin/tests") ||
      candidate.href.startsWith("/admin/blog") ||
      candidate.href.startsWith("/admin/course") ||
      candidate.entityType.includes("test") ||
      candidate.entityType.includes("course") ||
      candidate.entityType.includes("module") ||
      candidate.entityType.includes("post")
  },
  { permission: "users.view", scopes: ["all"], matches: (candidate) => candidate.href.startsWith("/admin/users") || candidate.href === "/admin" },
  { permission: "users.manage", scopes: ["all"], matches: (candidate) => candidate.href.startsWith("/admin/users") || candidate.href === "/admin" }
];

export function hasLoadedSearchRbacMetadata(context: SearchContext) {
  return Boolean(
    (Array.isArray(context.rbacRoles) && context.rbacRoles.length > 0) ||
      (Array.isArray(context.rbacPermissions) && context.rbacPermissions.length > 0) ||
      (context.rbacPermissionScopes && Object.keys(context.rbacPermissionScopes).length > 0)
  );
}

export function canUseSearchPermission(context: SearchContext, permission: string, allowedScopes: string[] = ["all"]) {
  if (!hasLoadedSearchRbacMetadata(context)) {
    return false;
  }

  if (!context.rbacPermissions?.includes(permission)) {
    return false;
  }

  const grantedScopes = context.rbacPermissionScopes?.[permission] ?? [];
  if (allowedScopes.length === 0) {
    return true;
  }

  return grantedScopes.some((scope) => scope === "all" || allowedScopes.includes(scope));
}

export function canUseAnySearchPermission(context: SearchContext, rules: SearchPermissionRule[]) {
  return rules.some((rule) => canUseSearchPermission(context, rule.permission, rule.scopes ?? ["all"]));
}

export function canUseStaffSearchCandidateExpansion(context: SearchContext) {
  return canUseAnySearchPermission(context, STAFF_CANDIDATE_EXPANSION_RULES);
}

export function canUseStudentOwnedSearchVisibility(context: SearchContext) {
  return canUseAnySearchPermission(context, [
    { permission: "students.view", scopes: ["all"] },
    { permission: "students.manage", scopes: ["all"] },
    { permission: "student_progress.view", scopes: ["all"] }
  ]);
}

export function canUseEnrollmentSearchVisibility(context: SearchContext) {
  return canUseAnySearchPermission(context, [
    { permission: "students.view", scopes: ["all"] },
    { permission: "students.manage", scopes: ["all"] },
    { permission: "student_progress.view", scopes: ["all"] },
    { permission: "content.manage", scopes: ["all"] }
  ]);
}

export function canUseRoleScopedSearchVisibility(candidate: SearchDocumentCandidate, context: SearchContext) {
  if (candidate.section !== "admin" && !candidate.roleScope.some((role) => role === "admin" || role === "manager" || role === "staff_admin")) {
    return false;
  }

  const matchedRules = ADMIN_SECTION_RULES.filter((rule) => rule.matches(candidate));
  if (matchedRules.length > 0) {
    return canUseAnySearchPermission(context, matchedRules);
  }

  return canUseStaffSearchCandidateExpansion(context);
}
