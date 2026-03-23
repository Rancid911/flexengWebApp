"use client";

import { AdminDrawer } from "@/app/(dashboard)/admin/ui/admin-drawer";
import { notificationTypeOptions, type NotificationForm } from "@/app/(dashboard)/admin/ui/admin-console.constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Заголовок</label>
          <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Текст уведомления</label>
          <textarea
            value={form.body}
            onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
            className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Тип</label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as NotificationForm["type"] }))}
            >
              {notificationTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Статус</label>
            <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
              />
              Активно
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Опубликовать (дата и время)</label>
            <Input
              type="datetime-local"
              value={form.published_at}
              onChange={(event) => setForm((prev) => ({ ...prev, published_at: event.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Скрыть после (опционально)</label>
            <Input
              type="datetime-local"
              value={form.expires_at}
              onChange={(event) => setForm((prev) => ({ ...prev, expires_at: event.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Для кого</label>
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
        </div>

        <Button type="submit" disabled={submitting}>
          {submitting ? "Сохранение..." : submitLabel}
        </Button>
      </form>
    </AdminDrawer>
  );
}
