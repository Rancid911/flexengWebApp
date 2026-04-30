import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useDashboardShellOverlays } from "@/app/(workspace)/use-dashboard-shell-state";

describe("useDashboardShellOverlays", () => {
  it("moves focus to mobile more close button on open and restores it to the trigger on keyboard close", async () => {
    const { result } = renderHook(() => useDashboardShellOverlays("/dashboard"));
    const trigger = document.createElement("button");
    const closeButton = document.createElement("button");
    document.body.append(trigger, closeButton);

    result.current.mobileMoreSheetTriggerRef.current = trigger;
    result.current.mobileMoreSheetCloseRef.current = closeButton;

    act(() => {
      trigger.focus();
      result.current.openMobileMoreSheet();
    });

    await waitFor(() => expect(document.activeElement).toBe(closeButton));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      result.current.closeMobileMoreSheet();
    });

    await waitFor(() => expect(document.activeElement).toBe(trigger));

    trigger.remove();
    closeButton.remove();
  });

  it("does not restore focus to the trigger on pointer close", async () => {
    const { result } = renderHook(() => useDashboardShellOverlays("/dashboard"));
    const trigger = document.createElement("button");
    const closeButton = document.createElement("button");
    document.body.append(trigger, closeButton);

    result.current.mobileMoreSheetTriggerRef.current = trigger;
    result.current.mobileMoreSheetCloseRef.current = closeButton;

    act(() => {
      result.current.openMobileMoreSheet();
    });

    await waitFor(() => expect(document.activeElement).toBe(closeButton));

    act(() => {
      window.dispatchEvent(new Event("pointerdown"));
      result.current.closeMobileMoreSheet();
    });

    await waitFor(() => expect(result.current.mobileMoreSheetOpen).toBe(false));
    expect(document.activeElement).not.toBe(trigger);

    trigger.remove();
    closeButton.remove();
  });
});
