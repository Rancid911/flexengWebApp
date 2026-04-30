type FocusableElement = HTMLElement | null | undefined;

export function focusFirstInvalidField<T extends string>(
  errors: Partial<Record<T, string>>,
  fields: Partial<Record<T, FocusableElement>>
) {
  const firstField = Object.keys(errors).find((key) => Boolean(errors[key as T]));
  if (!firstField) return;

  const target = fields[firstField as T];
  if (!target) return;

  queueMicrotask(() => {
    target.focus();
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      target.select?.();
    }
  });
}
