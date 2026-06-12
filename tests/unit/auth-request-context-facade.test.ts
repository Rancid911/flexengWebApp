import { describe, expect, it } from "vitest";

import * as resolver from "@/lib/auth/actor-resolver";
import * as adapter from "@/lib/auth/next-request-context";
import * as facade from "@/lib/auth/request-context";

describe("request context compatibility facade", () => {
  it("re-exports canonical resolver functions and error type", () => {
    expect(facade.AuthAccessError).toBe(resolver.AuthAccessError);
    expect(facade.assertStaffAdminCapability).toBe(
      resolver.assertStaffAdminCapability
    );
    expect(facade.buildAppActor).toBe(resolver.buildAppActor);
    expect(facade.isLinkedActorScopeRpcUnavailableMessage).toBe(
      resolver.isLinkedActorScopeRpcUnavailableMessage
    );
    expect(facade.isStaffAdminActor).toBe(resolver.isStaffAdminActor);
    expect(facade.isStudentActor).toBe(resolver.isStudentActor);
    expect(facade.isTeacherActor).toBe(resolver.isTeacherActor);
    expect(facade.normalizeLinkedActorScopeRpcData).toBe(
      resolver.normalizeLinkedActorScopeRpcData
    );
    expect(facade.normalizeRbacActorData).toBe(
      resolver.normalizeRbacActorData
    );
    expect(facade.resolveDefaultWorkspace).toBe(
      resolver.resolveDefaultWorkspace
    );
  });

  it("re-exports canonical Next loaders, guards and invalidators", () => {
    const exportNames = [
      "getAppActor",
      "getAuthActor",
      "getLayoutActor",
      "getMinimalRequestContext",
      "getProfileIdentityContext",
      "getProfileRequestContext",
      "getRequestContext",
      "getStaffRequestContext",
      "getStudentRequestContext",
      "invalidateFullAppActorCache",
      "invalidateLinkedActorScopeCache",
      "invalidateProfileIdentityCache",
      "invalidateRbacActorCache",
      "requireAppActor",
      "requireAppApiActor",
      "requireAuthActor",
      "requireLayoutActor",
      "requireMinimalRequestContext",
      "requireProfileIdentityContext",
      "requireProfileRequestContext",
      "requireRequestContext"
    ] as const;

    for (const exportName of exportNames) {
      expect(facade[exportName], exportName).toBe(adapter[exportName]);
    }
  });
});
