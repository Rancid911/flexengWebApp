"use client";

import { AdminDrawer } from "@/app/(dashboard)/admin/ui/admin-drawer";
import { englishLevelOptions, getRoleLabel, roleOptions, type UsersForm } from "@/app/(dashboard)/admin/ui/admin-console.constants";
import { backspaceRuPhone, normalizeRuPhoneInput } from "@/lib/phone";
import type { AdminUserDto } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type UserFormFieldKey =
  | "first_name"
  | "last_name"
  | "email"
  | "password"
  | "phone"
  | "birth_date"
  | "english_level"
  | "target_level"
  | "learning_goal"
  | "notes";

type Props = {
  open: boolean;
  title: string;
  form: UsersForm;
  editingUser: AdminUserDto | null;
  submitting: boolean;
  isStudentRole: boolean;
  fieldErrors: Partial<Record<UserFormFieldKey, string>>;
  formError: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => Promise<void> | void;
  setForm: <K extends keyof UsersForm>(key: K, value: UsersForm[K]) => void;
};

export function AdminUserFormDrawer({
  open,
  title,
  form,
  editingUser,
  submitting,
  isStudentRole,
  fieldErrors,
  formError,
  onClose,
  onSubmit,
  setForm
}: Props) {
  return (
    <AdminDrawer open={open} onClose={onClose} title={title} widthClass="max-w-[72rem]">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Роль</label>
          {editingUser ? (
            <Input value={getRoleLabel(form.role)} disabled className="ml-1 max-w-[14rem]" />
          ) : (
            <select
              data-testid="admin-user-role-select"
              className="ml-1 h-9 w-full max-w-[14rem] rounded-md border border-input bg-background px-3 text-sm"
              value={form.role}
              onChange={(event) => setForm("role", event.target.value as UsersForm["role"])}
              required
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Имя</label>
            <Input
              data-testid="admin-user-first-name-input"
              value={form.first_name}
              onChange={(event) => setForm("first_name", event.target.value)}
              className={cn(fieldErrors.first_name && "border-red-500")}
              required
            />
            {fieldErrors.first_name ? <p className="text-xs text-red-500">{fieldErrors.first_name}</p> : null}
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Фамилия</label>
            <Input
              data-testid="admin-user-last-name-input"
              value={form.last_name}
              onChange={(event) => setForm("last_name", event.target.value)}
              className={cn(fieldErrors.last_name && "border-red-500")}
              required
            />
            {fieldErrors.last_name ? <p className="text-xs text-red-500">{fieldErrors.last_name}</p> : null}
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Email</label>
            <Input
              data-testid="admin-user-email-input"
              value={form.email}
              onChange={(event) => setForm("email", event.target.value)}
              type="email"
              className={cn(fieldErrors.email && "border-red-500")}
              required
            />
            {fieldErrors.email ? <p className="text-xs text-red-500">{fieldErrors.email}</p> : null}
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Пароль</label>
            <Input
              data-testid="admin-user-password-input"
              value={form.password}
              onChange={(event) => setForm("password", event.target.value)}
              type="password"
              className={cn(fieldErrors.password && "border-red-500")}
              required={!editingUser}
              minLength={editingUser ? 0 : 8}
            />
            {fieldErrors.password ? <p className="text-xs text-red-500">{fieldErrors.password}</p> : null}
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Телефон</label>
            <Input
              data-testid="admin-user-phone-input"
              value={form.phone}
              onChange={(event) => setForm("phone", normalizeRuPhoneInput(event.target.value))}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && event.currentTarget.selectionStart === event.currentTarget.selectionEnd) {
                  event.preventDefault();
                  setForm("phone", backspaceRuPhone(form.phone));
                }
              }}
              placeholder="+7 (999) 999 99 99"
              className={cn(fieldErrors.phone && "border-red-500")}
              required
            />
            {fieldErrors.phone ? <p className="text-xs text-red-500">{fieldErrors.phone}</p> : null}
          </div>

          {isStudentRole ? (
            <>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">День рождения</label>
                <DateField
                  value={form.birth_date}
                  onChange={(value) => setForm("birth_date", value)}
                  className={cn(fieldErrors.birth_date && "[&>button]:border-red-500")}
                />
                {fieldErrors.birth_date ? <p className="text-xs text-red-500">{fieldErrors.birth_date}</p> : null}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Текущий уровень</label>
                <select
                  className={cn("h-10 w-full rounded-md border border-input bg-background px-3 text-sm", fieldErrors.english_level && "border-red-500")}
                  value={form.english_level}
                  onChange={(event) => setForm("english_level", event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Выберите уровень
                  </option>
                  {englishLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.english_level ? <p className="text-xs text-red-500">{fieldErrors.english_level}</p> : null}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Целевой уровень</label>
                <select
                  className={cn("h-10 w-full rounded-md border border-input bg-background px-3 text-sm", fieldErrors.target_level && "border-red-500")}
                  value={form.target_level}
                  onChange={(event) => setForm("target_level", event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Выберите уровень
                  </option>
                  {englishLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.target_level ? <p className="text-xs text-red-500">{fieldErrors.target_level}</p> : null}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Цель</label>
                <Input
                  value={form.learning_goal}
                  onChange={(event) => setForm("learning_goal", event.target.value)}
                  className={cn(fieldErrors.learning_goal && "border-red-500")}
                  required
                />
                {fieldErrors.learning_goal ? <p className="text-xs text-red-500">{fieldErrors.learning_goal}</p> : null}
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm text-muted-foreground">Заметки</label>
                <Input
                  value={form.notes}
                  onChange={(event) => setForm("notes", event.target.value)}
                  className={cn(fieldErrors.notes && "border-red-500")}
                />
                {fieldErrors.notes ? <p className="text-xs text-red-500">{fieldErrors.notes}</p> : null}
              </div>
            </>
          ) : null}
        </div>

        {formError ? <p data-testid="admin-user-form-error" className="text-sm text-red-500">{formError}</p> : null}

        <Button data-testid="admin-user-submit" type="submit" disabled={submitting}>
          {submitting ? "Сохранение..." : editingUser ? "Сохранить" : "Создать"}
        </Button>
      </form>
    </AdminDrawer>
  );
}
