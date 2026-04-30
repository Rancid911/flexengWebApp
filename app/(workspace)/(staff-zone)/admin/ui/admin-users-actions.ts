"use client";

import { useCallback, useState, type FormEvent } from "react";

import { defaultUsersForm, PAGE_SIZE, type UsersForm } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import type { AdminUsersStateSetter, DataDeps, RefreshDeps, UserFormFieldKey, UserFormSetter } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console-action-types";
import { ApiRequestError, fetchJson } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import { useAdminActionRunner } from "@/app/(workspace)/(staff-zone)/admin/ui/use-admin-action-runner";
import { useAsyncAction } from "@/hooks/use-async-action";
import type { AdminUserDto } from "@/lib/admin/types";
import { isValidRuPhone, toRuPhoneStorage } from "@/lib/phone";
import { mapUiErrorMessage } from "@/lib/ui-error-map";

const USER_FORM_FIELD_KEYS: UserFormFieldKey[] = [
  "first_name",
  "last_name",
  "email",
  "password",
  "phone",
  "birth_date",
  "english_level",
  "target_level",
  "learning_goal",
  "notes",
  "assigned_teacher_id",
  "billing_mode",
  "lesson_price_amount"
];

export function useAdminUsersActions({
  editingUser,
  refresh,
  data,
  reloadTeacherOptions,
  setActionError,
  setEditingUser,
  setUsers,
  setUsersDrawerOpen,
  setUsersForm
}: {
  editingUser: AdminUserDto | null;
  refresh: Pick<RefreshDeps, "prefetchNeighbors" | "usersPage" | "usersPageCount" | "usersQuery" | "usersRoleFilter">;
  data: Pick<DataDeps, "invalidateCacheForQuery" | "loadUsersPageData">;
  reloadTeacherOptions: () => Promise<unknown>;
  setActionError: (value: string) => void;
  setEditingUser: (value: AdminUserDto | null) => void;
  setUsers: AdminUsersStateSetter;
  setUsersDrawerOpen: (value: boolean) => void;
  setUsersForm: UserFormSetter;
}) {
  const { pending: deletingUser, runWithActionError } = useAdminActionRunner(setActionError);
  const { pending: submittingUser, run: runUserSubmit } = useAsyncAction();
  const [userFormError, setUserFormError] = useState("");
  const [userFormFieldErrors, setUserFormFieldErrors] = useState<Partial<Record<UserFormFieldKey, string>>>({});

  const clearUserFormErrors = useCallback(() => {
    setUserFormError("");
    setUserFormFieldErrors({});
  }, []);

  const setUserFieldValue = useCallback(
    <K extends keyof UsersForm>(key: K, value: UsersForm[K]) => {
      setUsersForm((prev) => ({ ...prev, [key]: value }));
      if (userFormFieldErrors[key as UserFormFieldKey]) {
        setUserFormFieldErrors((prev) => ({ ...prev, [key as UserFormFieldKey]: undefined }));
      }
    },
    [setUsersForm, userFormFieldErrors]
  );

  const openCreateUserDrawer = useCallback(async () => {
    await reloadTeacherOptions().catch((requestError) => {
      console.error("ADMIN_TEACHER_OPTIONS_REFRESH_BEFORE_CREATE_FAILED", requestError);
    });
    setEditingUser(null);
    setUsersForm(defaultUsersForm);
    clearUserFormErrors();
    setUsersDrawerOpen(true);
  }, [clearUserFormErrors, reloadTeacherOptions, setEditingUser, setUsersDrawerOpen, setUsersForm]);

  const startEditingUser = useCallback(
    async (item: AdminUserDto, nextForm: UsersForm) => {
      await reloadTeacherOptions().catch((requestError) => {
        console.error("ADMIN_TEACHER_OPTIONS_REFRESH_BEFORE_EDIT_FAILED", requestError);
      });
      setEditingUser(item);
      setUsersForm(nextForm);
      clearUserFormErrors();
      setUsersDrawerOpen(true);
    },
    [clearUserFormErrors, reloadTeacherOptions, setEditingUser, setUsersDrawerOpen, setUsersForm]
  );

  const submitUser = useCallback(
    async (event: FormEvent, usersForm: UsersForm, isStudentRole: boolean) => {
      event.preventDefault();
      if (submittingUser) return;

      await runUserSubmit({
        onStart: clearUserFormErrors,
        onError: (requestError) => {
          if (requestError instanceof ApiRequestError && requestError.code === "VALIDATION_ERROR") {
            const nextFieldErrors: Partial<Record<UserFormFieldKey, string>> = {};
            const fieldErrors = requestError.details?.fieldErrors ?? {};
            const formErrors = requestError.details?.formErrors ?? [];

            for (const key of USER_FORM_FIELD_KEYS) {
              const firstError = fieldErrors[key]?.[0];
              if (!firstError) continue;
              nextFieldErrors[key] = mapUiErrorMessage(firstError, "Проверьте корректность поля.");
            }

            setUserFormFieldErrors(nextFieldErrors);
            setUserFormError(mapUiErrorMessage(formErrors[0], requestError.message || "Проверьте правильность заполнения полей."));
            return;
          }

          setUserFormError(requestError instanceof Error ? mapUiErrorMessage(requestError.message, "Не удалось сохранить пользователя") : "Не удалось сохранить пользователя");
        },
        action: async () => {
          const normalizedPhone = toRuPhoneStorage(usersForm.phone);
          if (!isValidRuPhone(usersForm.phone) || !normalizedPhone) {
            setUserFormFieldErrors((prev) => ({ ...prev, phone: "Телефон должен быть в формате +7 (999) 999 99 99" }));
            return null;
          }

          const studentFields = {
            birth_date: isStudentRole ? usersForm.birth_date || null : null,
            english_level: isStudentRole ? usersForm.english_level || null : null,
            target_level: isStudentRole ? usersForm.target_level || null : null,
            learning_goal: isStudentRole ? usersForm.learning_goal || null : null,
            notes: isStudentRole ? usersForm.notes || null : null,
            assigned_teacher_id: isStudentRole ? usersForm.assigned_teacher_id || null : null,
            billing_mode: isStudentRole ? usersForm.billing_mode || null : null,
            lesson_price_amount:
              isStudentRole && usersForm.billing_mode === "per_lesson_price" && usersForm.lesson_price_amount.trim()
                ? Number(usersForm.lesson_price_amount)
                : null
          };

          if (editingUser) {
            const payload = {
              first_name: usersForm.first_name.trim(),
              last_name: usersForm.last_name.trim(),
              email: usersForm.email.trim(),
              password: usersForm.password.trim() || null,
              phone: normalizedPhone,
              ...studentFields
            };
            const saved = await fetchJson<AdminUserDto>(`/api/admin/users/${editingUser.id}`, { method: "PATCH", body: JSON.stringify(payload) });
            setUsers((prev) => ({ ...prev, items: prev.items.map((item) => (item.id === saved.id ? saved : item)) }));
          } else {
            const payload = {
              role: usersForm.role,
              first_name: usersForm.first_name.trim(),
              last_name: usersForm.last_name.trim(),
              email: usersForm.email.trim(),
              password: usersForm.password,
              phone: normalizedPhone,
              ...studentFields
            };
            const created = await fetchJson<AdminUserDto>("/api/admin/users", { method: "POST", body: JSON.stringify(payload) });
            setUsers((prev) => {
              const matchesRoleFilter = refresh.usersRoleFilter === "all" || created.role === refresh.usersRoleFilter;
              if (!matchesRoleFilter) return prev;
              const alreadyPresent = prev.items.some((item) => item.id === created.id);
              const nextItems = alreadyPresent ? prev.items : [created, ...prev.items].slice(0, PAGE_SIZE);
              return { ...prev, items: nextItems, total: alreadyPresent ? prev.total : prev.total + 1 };
            });
          }

          return true;
        },
        onSuccess: async (result) => {
          if (!result) return;
          await reloadTeacherOptions().catch((requestError) => {
            console.error("ADMIN_TEACHER_OPTIONS_REFRESH_AFTER_SAVE_FAILED", requestError);
          });
          setUsersDrawerOpen(false);
          setEditingUser(null);
          setUsersForm(defaultUsersForm);
          clearUserFormErrors();
          data.invalidateCacheForQuery("users", refresh.usersQuery, refresh.usersRoleFilter);
          void data.loadUsersPageData(refresh.usersPage, refresh.usersQuery, refresh.usersRoleFilter).catch((requestError) => {
            console.error("ADMIN_USERS_REFRESH_AFTER_SAVE_FAILED", requestError);
          });
          refresh.prefetchNeighbors("users", refresh.usersPage, refresh.usersPageCount, refresh.usersQuery, refresh.usersRoleFilter);
        }
      });
    },
    [clearUserFormErrors, data, editingUser, refresh, reloadTeacherOptions, runUserSubmit, setEditingUser, setUsers, setUsersDrawerOpen, setUsersForm, submittingUser]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      if (!window.confirm("Удалить пользователя?")) return;
      await runWithActionError({
        fallbackMessage: "Не удалось удалить пользователя",
        action: async () => {
          await fetchJson(`/api/admin/users/${id}`, { method: "DELETE" });
          await reloadTeacherOptions().catch((requestError) => {
            console.error("ADMIN_TEACHER_OPTIONS_REFRESH_AFTER_DELETE_FAILED", requestError);
          });
          data.invalidateCacheForQuery("users", refresh.usersQuery, refresh.usersRoleFilter);
          await data.loadUsersPageData(refresh.usersPage, refresh.usersQuery, refresh.usersRoleFilter, { revalidate: true });
          refresh.prefetchNeighbors("users", refresh.usersPage, refresh.usersPageCount, refresh.usersQuery, refresh.usersRoleFilter);
        }
      });
    },
    [data, refresh, reloadTeacherOptions, runWithActionError]
  );

  return {
    clearUserFormErrors,
    deleteUser,
    openCreateUserDrawer,
    setUserFieldValue,
    startEditingUser,
    submitUser,
    submittingUser: submittingUser || deletingUser,
    userFormError,
    userFormFieldErrors
  };
}
