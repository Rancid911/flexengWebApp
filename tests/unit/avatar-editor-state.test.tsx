import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AVATAR_ZOOM_DEFAULT,
  getAvatarInitialZoom,
  normalizeAvatarImage,
  useAvatarEditorState
} from "@/app/(workspace)/(shared-zone)/settings/use-avatar-editor-state";

describe("avatar editor state", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calculates a gentler initial zoom for portrait and landscape images than for square ones", () => {
    expect(getAvatarInitialZoom(1200, 1200)).toBeGreaterThan(getAvatarInitialZoom(1200, 1800));
    expect(getAvatarInitialZoom(1200, 1200)).toBeGreaterThan(getAvatarInitialZoom(1800, 1200));
    expect(getAvatarInitialZoom(1200, 1800)).toBeGreaterThanOrEqual(1);
    expect(getAvatarInitialZoom(1800, 1200)).toBeGreaterThanOrEqual(1);
  });

  it("starts crop mode with the computed zoom for the normalized image", () => {
    const { result } = renderHook(() => useAvatarEditorState(null));

    act(() => {
      result.current.startAvatarCrop({
        dataUrl: "data:image/png;base64,avatar",
        width: 900,
        height: 1600
      });
    });

    expect(result.current.cropSource).toBe("data:image/png;base64,avatar");
    expect(result.current.cropZoom).toBe(getAvatarInitialZoom(900, 1600));
    expect(result.current.cropZoom).not.toBe(AVATAR_ZOOM_DEFAULT);
  });

  it("normalizes avatar images through ImageBitmap when available", async () => {
    const clearRect = vi.fn();
    const drawImage = vi.fn();
    const getContext = vi.fn(() => ({
      clearRect,
      drawImage
    }));
    const toDataURL = vi.fn(() => "data:image/png;base64,normalized");
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext,
          toDataURL
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName);
    });

    const close = vi.fn();
    const createImageBitmapMock = vi.fn(async () => ({
      width: 900,
      height: 1600,
      close
    }));
    vi.stubGlobal("createImageBitmap", createImageBitmapMock);

    const file = new File(["avatar"], "avatar.jpg", { type: "image/jpeg" });
    const result = await normalizeAvatarImage(file);

    expect(createImageBitmapMock).toHaveBeenCalledWith(file, { imageOrientation: "from-image" });
    expect(getContext).toHaveBeenCalledWith("2d");
    expect(drawImage).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
    expect(result).toEqual({
      dataUrl: "data:image/png;base64,normalized",
      width: 900,
      height: 1600
    });
  });
});
