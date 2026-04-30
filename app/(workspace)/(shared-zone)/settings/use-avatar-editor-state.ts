"use client";

import { useCallback, useState } from "react";
import type { Area } from "react-easy-crop";

import { useAsyncAction } from "@/hooks/use-async-action";
import { mapUiErrorMessage } from "@/lib/ui-error-map";

export const AVATAR_CROP_SIZE = 220;
export const AVATAR_EXPORT_SIZE = 512;
export const AVATAR_ZOOM_MIN = 0.5;
export const AVATAR_ZOOM_MAX = 4;
export const AVATAR_ZOOM_DEFAULT = 1.15;
export const AVATAR_ZOOM_STEP = 0.05;

export type AvatarCropSource = {
  dataUrl: string;
  width: number;
  height: number;
};

function loadImageFromDataUrl(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Не удалось прочитать изображение"));
    img.src = src;
  });
}

function loadImageFromObjectUrl(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Не удалось прочитать изображение"));
    img.src = src;
  });
}

function renderNormalizedAvatar(
  source: CanvasImageSource,
  width: number,
  height: number
): AvatarCropSource {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Не удалось подготовить изображение");
  context.clearRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
  return {
    dataUrl: canvas.toDataURL("image/png"),
    width,
    height
  };
}

export function getAvatarInitialZoom(width: number, height: number) {
  if (width <= 0 || height <= 0) return AVATAR_ZOOM_DEFAULT;
  const aspectRatio = Math.max(width, height) / Math.min(width, height);
  const extraZoom = Math.max(0, 0.12 - Math.min(1, aspectRatio - 1) * 0.12);
  return Math.min(AVATAR_ZOOM_MAX, Math.max(AVATAR_ZOOM_MIN, Number((1 + extraZoom).toFixed(2))));
}

export async function normalizeAvatarImage(file: File): Promise<AvatarCropSource> {
  if (typeof window === "undefined") {
    throw new Error("Нормализация изображения доступна только в браузере");
  }

  if (typeof window.createImageBitmap === "function") {
    try {
      const bitmap = await window.createImageBitmap(file, { imageOrientation: "from-image" });
      try {
        return renderNormalizedAvatar(bitmap, bitmap.width, bitmap.height);
      } finally {
        bitmap.close();
      }
    } catch {
      // Fall back to HTMLImageElement for browsers that fail to decode via ImageBitmap.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImageFromObjectUrl(objectUrl);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    return renderNormalizedAvatar(image, width, height);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(meta)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

export function useAvatarEditorState(initialAvatarUrl: string | null) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(AVATAR_ZOOM_DEFAULT);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);
  const [pendingAvatarDelete, setPendingAvatarDelete] = useState(false);
  const { pending: applyingCrop, run: runCropApply } = useAsyncAction();

  const resetCrop = useCallback(() => {
    setCropSource(null);
    setCropZoom(AVATAR_ZOOM_DEFAULT);
    setCropPosition({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
  }, []);

  const startAvatarCrop = useCallback(
    (source: AvatarCropSource) => {
      setCropSource(source.dataUrl);
      setCropZoom(getAvatarInitialZoom(source.width, source.height));
      setCropPosition({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
      setAvatarError("");
    },
    []
  );

  const handleAvatarDelete = useCallback(() => {
    setAvatarError("");
    setAvatarMessage("Аватар будет удалён после сохранения");
    setPendingAvatarBlob(null);
    setPendingAvatarDelete(true);
    setAvatarUrl(null);
    resetCrop();
  }, [resetCrop]);

  const applyCroppedAvatar = useCallback(async () => {
    if (!cropSource || !croppedAreaPixels) return;
    await runCropApply({
      onStart: () => {
        setAvatarError("");
        setAvatarMessage("");
      },
      onError: (error) => {
        setAvatarError(mapUiErrorMessage(error instanceof Error ? error.message : "", "Не удалось применить кадрирование"));
      },
      action: async () => {
        const canvas = document.createElement("canvas");
        canvas.width = AVATAR_EXPORT_SIZE;
        canvas.height = AVATAR_EXPORT_SIZE;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Не удалось подготовить изображение");

        const image = await loadImageFromDataUrl(cropSource);
        const sourceX = Math.max(0, Math.round(croppedAreaPixels.x));
        const sourceY = Math.max(0, Math.round(croppedAreaPixels.y));
        const sourceWidth = Math.max(1, Math.round(croppedAreaPixels.width));
        const sourceHeight = Math.max(1, Math.round(croppedAreaPixels.height));

        context.clearRect(0, 0, AVATAR_EXPORT_SIZE, AVATAR_EXPORT_SIZE);
        context.save();
        context.beginPath();
        context.arc(AVATAR_EXPORT_SIZE / 2, AVATAR_EXPORT_SIZE / 2, AVATAR_EXPORT_SIZE / 2, 0, Math.PI * 2);
        context.closePath();
        context.clip();
        context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, AVATAR_EXPORT_SIZE, AVATAR_EXPORT_SIZE);
        context.restore();

        return canvas.toDataURL("image/png");
      },
      onSuccess: (dataUrl) => {
        const blob = dataUrlToBlob(dataUrl);
        setPendingAvatarBlob(blob);
        setPendingAvatarDelete(false);
        setAvatarUrl(dataUrl);
        setAvatarMessage("Новый аватар будет сохранён после нажатия «Сохранить изменения»");
        resetCrop();
      }
    });
  }, [cropSource, croppedAreaPixels, resetCrop, runCropApply]);

  return {
    avatarUrl,
    avatarMessage,
    avatarError,
    cropSource,
    cropZoom,
    cropPosition,
    croppedAreaPixels,
    applyingCrop,
    pendingAvatarBlob,
    pendingAvatarDelete,
    setAvatarUrl,
    setAvatarMessage,
    setAvatarError,
    setCropZoom,
    setCropPosition,
    setCroppedAreaPixels,
    setPendingAvatarBlob,
    setPendingAvatarDelete,
    startAvatarCrop,
    resetCrop,
    handleAvatarDelete,
    applyCroppedAvatar
  };
}
