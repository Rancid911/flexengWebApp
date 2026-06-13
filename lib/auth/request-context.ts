export {
  AuthAccessError,
  assertStaffAdminCapability,
  buildAppActor,
  isLinkedActorScopeRpcUnavailableMessage,
  isStaffAdminActor,
  isStudentActor,
  isTeacherActor,
  normalizeLinkedActorScopeRpcData,
  normalizeRbacActorData,
  resolveDefaultWorkspace
} from "@/lib/auth/actor-resolver";
export type {
  AppActor,
  AppCapability,
  MinimalRequestContext,
  ProfileRequestContext,
  RbacStatus,
  RequestContext,
  StaffAdminActor,
  StudentActor,
  TeacherActor
} from "@/lib/auth/actor-resolver";
export {
  getAppActor,
  getAuthActor,
  getLayoutActor,
  getMinimalRequestContext,
  getProfileIdentityContext,
  getProfileRequestContext,
  getRequestContext,
  getStaffRequestContext,
  getStudentRequestContext,
  invalidateFullAppActorCache,
  invalidateLinkedActorScopeCache,
  invalidateProfileIdentityCache,
  invalidateRbacActorCache,
  requireAppActor,
  requireAppApiActor,
  requireAuthActor,
  requireLayoutActor,
  requireMinimalRequestContext,
  requireProfileIdentityContext,
  requireProfileRequestContext,
  requireRequestContext
} from "@/lib/auth/next-request-context";
