"use client";

import { adminPrimaryButtonClassName } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-button-tokens";
import { AdminDrawer } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-drawer";
import { englishLevelOptions, getRoleLabel, roleOptions, type UsersForm } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import { backspaceRuPhone, normalizeRuPhoneInput } from "@/lib/phone";
import type { AdminUserDto, TeacherOptionDto } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
  | "notes"
  | "assigned_teacher_id"
  | "billing_mode"
  | "lesson_price_amount";

type Props = {
  open: boolean;
  title: string;
  form: UsersForm;
  editingUser: AdminUserDto | null;
  teacherOptions: TeacherOptionDto[];
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
  teacherOptions,
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
        <FormField label="Роль">
          {editingUser ? (
            <Input value={getRoleLabel(form.role)} disabled className="ml-1 max-w-[14rem]" />
          ) : (
            <Select
              data-testid="admin-user-role-select"
              className="ml-1 h-9 w-full max-w-[14rem]"
              value={form.role}
              onChange={(event) => setForm("role", event.target.value as UsersForm["role"])}
              required
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </FormField>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Имя" error={fieldErrors.first_name}>
            <Input
              data-testid="admin-user-first-name-input"
              value={form.first_name}
              onChange={(event) => setForm("first_name", event.target.value)}
              className={cn(fieldErrors.first_name && "border-red-500")}
              required
            />
          </FormField>
          <FormField label="Фамилия" error={fieldErrors.last_name}>
            <Input
              data-testid="admin-user-last-name-input"
              value={form.last_name}
              onChange={(event) => setForm("last_name", event.target.value)}
              className={cn(fieldErrors.last_name && "border-red-500")}
              required
            />
          </FormField>
          <FormField label="Email" error={fieldErrors.email}>
            <Input
              data-testid="admin-user-email-input"
              value={form.email}
              onChange={(event) => setForm("email", event.target.value)}
              type="email"
              className={cn(fieldErrors.email && "border-red-500")}
              required
            />
          </FormField>
          <FormField label="Пароль" error={fieldErrors.password}>
            <Input
              data-testid="admin-user-password-input"
              value={form.password}
              onChange={(event) => setForm("password", event.target.value)}
              type="password"
              className={cn(fieldErrors.password && "border-red-500")}
              required={!editingUser}
              minLength={editingUser ? 0 : 8}
            />
          </FormField>
          <FormField label="Телефон" error={fieldErrors.phone}>
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
          </FormField>

          {isStudentRole ? (
            <>
              <div className="md:col-span-2 rounded-xl border border-border bg-muted/20 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Учебный профиль</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Базовые данные студента: уровень, цель и заметки для команды.
                </p>
              </div>
              <FormField label="День рождения" error={fieldErrors.birth_date}>
                <DateField
                  value={form.birth_date}
                  onChange={(value) => setForm("birth_date", value)}
                  className={cn(fieldErrors.birth_date && "[&>button]:border-red-500")}
                />
              </FormField>
              <FormField label="Текущий уровень" error={fieldErrors.english_level}>
                <Select
                  className={cn(fieldErrors.english_level && "border-red-500")}
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
                </Select>
              </FormField>
              <FormField label="Целевой уровень" error={fieldErrors.target_level}>
                <Select
                  className={cn(fieldErrors.target_level && "border-red-500")}
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
                </Select>
              </FormField>
              <FormField label="Цель" error={fieldErrors.learning_goal}>
                <Input
                  value={form.learning_goal}
                  onChange={(event) => setForm("learning_goal", event.target.value)}
                  className={cn(fieldErrors.learning_goal && "border-red-500")}
                  required
                />
              </FormField>
              <FormField
                label="Преподаватель"
                error={fieldErrors.assigned_teacher_id}
                hint="Назначение задаёт основного преподавателя ученика."
              >
                <Select
                  className={cn(fieldErrors.assigned_teacher_id && "border-red-500")}
                  value={form.assigned_teacher_id}
                  onChange={(event) => setForm("assigned_teacher_id", event.target.value)}
                >
                  <option value="">Не назначен</option>
                  {teacherOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Заметки" error={fieldErrors.notes} className="md:col-span-2">
                <Input
                  value={form.notes}
                  onChange={(event) => setForm("notes", event.target.value)}
                  className={cn(fieldErrors.notes && "border-red-500")}
                />
              </FormField>
              <div className="md:col-span-2 rounded-xl border border-indigo-200 bg-indigo-50/40 px-4 py-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">Оплата и списания</p>
                  <p className="text-xs text-slate-600">
                    Настройте, как будут списываться проведённые уроки: по пакету или по фиксированной цене одного урока. Во всех режимах система считает доступные именно уроки.
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    label="Режим списания"
                    error={fieldErrors.billing_mode}
                    hint={
                      form.billing_mode === "package_lessons"
                        ? "После completed будет списываться 1 урок из пакета, а цена урока будет браться из покупок пакетов."
                        : form.billing_mode === "per_lesson_price"
                          ? "После completed будет списываться фиксированная сумма, а доступность будет считаться в уроках."
                          : "Если не настроено, автоматические списания не применяются."
                    }
                  >
                    <Select
                      className={cn(fieldErrors.billing_mode && "border-red-500")}
                      value={form.billing_mode}
                      onChange={(event) => setForm("billing_mode", event.target.value as UsersForm["billing_mode"])}
                    >
                      <option value="">Не настроено</option>
                      <option value="package_lessons">Пакет уроков</option>
                      <option value="per_lesson_price">Списание по цене урока</option>
                    </Select>
                  </FormField>
                  <FormField
                    label="Цена одного урока"
                    error={fieldErrors.lesson_price_amount}
                    hint="Поле используется только для режима «Списание по цене урока»."
                  >
                    <Input
                      value={form.lesson_price_amount}
                      onChange={(event) => setForm("lesson_price_amount", event.target.value)}
                      className={cn(fieldErrors.lesson_price_amount && "border-red-500")}
                      inputMode="decimal"
                      placeholder={form.billing_mode === "per_lesson_price" ? "Например, 1800" : "Доступно для режима по цене урока"}
                      disabled={form.billing_mode !== "per_lesson_price"}
                    />
                  </FormField>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {formError ? <p data-testid="admin-user-form-error" className="text-sm text-red-500">{formError}</p> : null}

        <Button data-testid="admin-user-submit" type="submit" disabled={submitting} className={adminPrimaryButtonClassName}>
          {submitting ? "Сохранение..." : editingUser ? "Сохранить" : "Создать"}
        </Button>
      </form>
    </AdminDrawer>
  );
}
