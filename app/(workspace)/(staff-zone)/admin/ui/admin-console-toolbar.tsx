"use client";

import { adminActiveTabClassName, adminInactiveTabClassName, adminPrimaryButtonClassName } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-button-tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AdminUserRole } from "@/lib/admin/types";
import type { TabId } from "./admin-console.constants";

type AdminConsoleToolbarProps = {
  q: string;
  setQ: (value: string) => void;
  setTabAndSyncQuery: (tab: TabId) => void;
  tab: TabId;
  usersRoleFilter: AdminUserRole | "all";
  setUsersRoleFilter: (role: AdminUserRole | "all") => void;
  onCreateTest: () => void;
  onCreateUser: () => void;
  onCreateBlogPost: () => void;
  onCreateNotification: () => void;
};

export function AdminConsoleToolbar({
  q,
  setQ,
  setTabAndSyncQuery,
  tab,
  usersRoleFilter,
  setUsersRoleFilter,
  onCreateTest,
  onCreateUser,
  onCreateBlogPost,
  onCreateNotification
}: AdminConsoleToolbarProps) {
  const getTabClassName = (tabId: TabId) => (tab === tabId ? adminActiveTabClassName : adminInactiveTabClassName);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button className={getTabClassName("tests")} onClick={() => setTabAndSyncQuery("tests")} type="button" variant="outline">
          Учебные материалы
        </Button>
        <Button
          className={getTabClassName("users")}
          data-testid="admin-tab-users"
          onClick={() => setTabAndSyncQuery("users")}
          type="button"
          variant="outline"
        >
          Пользователи
        </Button>
        <Button className={getTabClassName("blog")} onClick={() => setTabAndSyncQuery("blog")} type="button" variant="outline">
          Блог
        </Button>
        <Button
          className={getTabClassName("notifications")}
          onClick={() => setTabAndSyncQuery("notifications")}
          type="button"
          variant="outline"
        >
          Уведомления
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tab === "users" ? (
          <div className="flex flex-nowrap items-center gap-2">
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Поиск..." className="w-[320px] max-w-sm" />
            <Select
              data-testid="admin-users-role-filter"
              className="h-9 w-[150px]"
              value={usersRoleFilter}
              onChange={(event) => setUsersRoleFilter(event.target.value as AdminUserRole | "all")}
            >
              <option value="all">Все роли</option>
              <option value="student">Студент</option>
              <option value="teacher">Преподаватель</option>
              <option value="manager">Менеджер</option>
              <option value="admin">Администратор</option>
            </Select>
            <Button data-testid="admin-create-user" onClick={onCreateUser} type="button" className={adminPrimaryButtonClassName}>
              Добавить пользователя
            </Button>
          </div>
        ) : (
          <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Поиск..." className="max-w-sm" />
        )}
        {tab === "tests" ? (
          <Button onClick={onCreateTest} type="button" className={adminPrimaryButtonClassName}>
            Создать материал
          </Button>
        ) : null}
        {tab === "blog" ? (
          <Button data-testid="admin-create-blog" onClick={onCreateBlogPost} type="button" className={adminPrimaryButtonClassName}>
            Создать статью
          </Button>
        ) : null}
        {tab === "notifications" ? (
          <Button data-testid="admin-create-notification" onClick={onCreateNotification} type="button" className={adminPrimaryButtonClassName}>
            Создать уведомление
          </Button>
        ) : null}
      </div>
    </div>
  );
}
