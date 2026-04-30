"use client";

import { adminPrimaryButtonClassName } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-button-tokens";
import { AdminDrawer } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-drawer";
import { notificationTypeOptions, type NotificationForm } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import { Button } from "@/components/ui/button";
import { CheckboxField, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const roleOptions: Array<{ value: "all" | "student" | "teacher" | "manager" | "admin"; label: string }> = [
  { value: "all", label: "Все роли" },
  { value: "student", label: "Студент" },
  { value: "teacher", label: "Преподаватель" },
  { value: "manager", label: "Менеджер" },
  { value: "admin", label: "Администратор" }
];

type Props = {
  open: boolean;
  title: string;
  form: NotificationForm;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => Promise<void> | void;
  setForm: React.Dispatch<React.SetStateAction<NotificationForm>>;
  submitLabel: string;
};

export function AdminNotificationFormDrawer({
  open,
  title,
  form,
  submitting,
  onClose,
  onSubmit,
  setForm,
  submitLabel
}: Props) {
  return (
    <AdminDrawer open={open} onClose={onClose} title={title} widthClass="max-w-3xl">
      <form className="space-y-3" onSubmit={onSubmit}>
        <FormField label="Заголовок">
          <Input
            data-testid="admin-notification-title-input"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
        </FormField>

        <FormField label="Текст уведомления">
          <Textarea
            data-testid="admin-notification-body-input"
            value={form.body}
            onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
            className="min-h-28"
            required
          />
        </FormField>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormField label="Тип">
            <Select
              data-testid="admin-notification-type-select"
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as NotificationForm["type"] }))}
            >
              {notificationTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Статус">
            <CheckboxField label="Активно">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
              />
            </CheckboxField>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormField label="Опубликовать (дата и время)">
            <Input
              type="datetime-local"
              value={form.published_at}
              onChange={(event) => setForm((prev) => ({ ...prev, published_at: event.target.value }))}
            />
          </FormField>
          <FormField label="Скрыть после (опционально)">
            <Input
              type="datetime-local"
              value={form.expires_at}
              onChange={(event) => setForm((prev) => ({ ...prev, expires_at: event.target.value }))}
            />
          </FormField>
        </div>

        <FormField label="Для кого">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {roleOptions.map((option) => {
              const checked = form.target_roles.includes(option.value);
              const allSelected = form.target_roles.includes("all");
              const disabled = option.value !== "all" && allSelected;
              return (
                <label key={option.value} className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) => {
                      const enabled = event.target.checked;
                      setForm((prev) => {
                        if (option.value === "all") {
                          return { ...prev, target_roles: enabled ? ["all"] : ["student"] };
                        }
                        const withoutAll = prev.target_roles.filter((role) => role !== "all");
                        const nextRoles = enabled
                          ? Array.from(new Set([...withoutAll, option.value]))
                          : withoutAll.filter((role) => role !== option.value);
                        return { ...prev, target_roles: nextRoles.length > 0 ? nextRoles : ["all"] };
                      });
                    }}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </FormField>

        <Button data-testid="admin-notification-submit" type="submit" disabled={submitting} className={adminPrimaryButtonClassName}>
          {submitting ? "Сохранение..." : submitLabel}
        </Button>
      </form>
    </AdminDrawer>
  );
}
