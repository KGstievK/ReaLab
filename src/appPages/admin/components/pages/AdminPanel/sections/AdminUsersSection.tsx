"use client";

import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiShield, FiTrash2, FiUserCheck } from "react-icons/fi";
import scss from "../AdminPanel.module.scss";
import { formatDate, formatMoney, formatRoleLabel } from "../AdminPanel.shared";

type AdminUsersSectionProps = {
  users: AdminPaginatedResponse<AdminUser>;
  roles: AdminRbacRole[];
  permissions: AdminPermissionItem[];
  search: string;
  currentPage: number;
  pageSize: number;
  sorting: "newest" | "oldest" | "email_asc" | "email_desc" | "name_asc" | "name_desc";
  roleFilter: AdminRole | "all";
  activeFilter: "all" | "active" | "inactive";
  canManageUsers: boolean;
  isRoleMutationLoading: boolean;
  isUpdatingUserRoles: boolean;
  onSearchChange: (value: string) => void;
  onSortChange: (
    value: "newest" | "oldest" | "email_asc" | "email_desc" | "name_asc" | "name_desc",
  ) => void;
  onRoleFilterChange: (value: AdminRole | "all") => void;
  onActiveFilterChange: (value: "all" | "active" | "inactive") => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onResetListFilters: () => void;
  onCreateRole: (data: IADMIN.PostRoleReq) => Promise<void>;
  onUpdateRole: (id: number, data: IADMIN.PatchRoleReq["data"]) => Promise<void>;
  onDeleteRole: (role: AdminRbacRole) => Promise<void>;
  onUpdateUserRoles: (user: AdminUser, roleKeys: string[]) => Promise<void>;
};

type RoleEditorState = {
  mode: "create" | "edit";
  id: number | null;
  key: string;
  name: string;
  description: string;
  permissions: string[];
};

const createRoleEditorState = (): RoleEditorState => ({
  mode: "create",
  id: null,
  key: "",
  name: "",
  description: "",
  permissions: [],
});

const mapRoleToEditorState = (role: AdminRbacRole): RoleEditorState => ({
  mode: "edit",
  id: role.id,
  key: role.key,
  name: role.name,
  description: role.description || "",
  permissions: role.permissions.map((item) => item.key),
});

const toggleValue = (values: string[], value: string): string[] =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const USER_SORT_LABELS = {
  newest: "Сначала новые",
  oldest: "Сначала старые",
  email_asc: "Email: A-Z",
  email_desc: "Email: Z-A",
  name_asc: "Имя: А-Я",
  name_desc: "Имя: Я-А",
} as const;

export const AdminUsersSection = ({
  users,
  roles,
  permissions,
  search,
  currentPage,
  pageSize,
  sorting,
  roleFilter,
  activeFilter,
  canManageUsers,
  isRoleMutationLoading,
  isUpdatingUserRoles,
  onSearchChange,
  onSortChange,
  onRoleFilterChange,
  onActiveFilterChange,
  onPageChange,
  onPageSizeChange,
  onResetListFilters,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onUpdateUserRoles,
}: AdminUsersSectionProps) => {
  const [editingRoleId, setEditingRoleId] = useState<number | "create" | null>(null);
  const [roleEditor, setRoleEditor] = useState<RoleEditorState>(createRoleEditorState());
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userRoleDrafts, setUserRoleDrafts] = useState<Record<number, string[]>>({});
  const [pageJumpValue, setPageJumpValue] = useState(String(currentPage));

  useEffect(() => {
    setUserRoleDrafts((prev) => {
      const next = { ...prev };
      users.results.forEach((user) => {
        if (!next[user.id]) {
          next[user.id] = user.assigned_roles.map((role) => role.key);
        }
      });
      return next;
    });
  }, [users.results]);

  useEffect(() => {
    if (!users.results.length) {
      setSelectedUserId(null);
      return;
    }

    const hasCurrentUser = users.results.some((item) => item.id === selectedUserId);
    if (!hasCurrentUser) {
      setSelectedUserId(users.results[0].id);
    }
  }, [selectedUserId, users.results]);

  useEffect(() => {
    if (editingRoleId === null) {
      return;
    }

    if (editingRoleId === "create") {
      setRoleEditor(createRoleEditorState());
      return;
    }

    const role = roles.find((item) => item.id === editingRoleId);
    if (role) {
      setRoleEditor(mapRoleToEditorState(role));
    }
  }, [editingRoleId, roles]);

  useEffect(() => {
    setPageJumpValue(String(currentPage));
  }, [currentPage]);

  const selectedUser = useMemo(
    () => users.results.find((item) => item.id === selectedUserId) ?? null,
    [selectedUserId, users.results],
  );
  const editingRole =
    editingRoleId && editingRoleId !== "create"
      ? roles.find((item) => item.id === editingRoleId) ?? null
      : null;
  const isEditingSystemRole = Boolean(editingRole?.is_system);

  const roleMap = useMemo(
    () => new Map(roles.map((role) => [role.key, role])),
    [roles],
  );

  const selectedUserRoleKeys = selectedUser
    ? userRoleDrafts[selectedUser.id] ?? selectedUser.assigned_roles.map((role) => role.key)
    : [];

  const selectedUserPermissions = useMemo(() => {
    if (!selectedUser) {
      return [];
    }

    const currentlyAssignedKeys = new Set(
      selectedUser.assigned_roles.flatMap((role) =>
        roleMap.get(role.key)?.permissions.map((permission) => permission.key) ?? [],
      ),
    );

    const effectivePermissionKeys = new Set(
      selectedUser.permissions.filter((permissionKey) => !currentlyAssignedKeys.has(permissionKey)),
    );

    selectedUserRoleKeys.forEach((roleKey) => {
      const role = roleMap.get(roleKey);
      role?.permissions.forEach((permission) => {
        effectivePermissionKeys.add(permission.key);
      });
    });

    return permissions
      .filter((permission) => effectivePermissionKeys.has(permission.key))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [permissions, roleMap, selectedUser, selectedUserRoleKeys]);

  const totalPages = Math.max(1, Math.ceil(users.count / pageSize));
  const rangeStart = users.count === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = users.count === 0 ? 0 : Math.min(currentPage * pageSize, users.count);

  const handlePageJump = () => {
    const parsed = Number(pageJumpValue);
    if (!Number.isFinite(parsed)) {
      setPageJumpValue(String(currentPage));
      return;
    }

    const nextPage = Math.min(totalPages, Math.max(1, Math.trunc(parsed)));
    if (nextPage !== currentPage) {
      onPageChange(nextPage);
    }
    setPageJumpValue(String(nextPage));
  };

  const startCreateRole = () => {
    setEditingRoleId("create");
  };

  const startEditRole = (role: AdminRbacRole) => {
    setEditingRoleId(role.id);
  };

  const closeRoleEditor = () => {
    setEditingRoleId(null);
    setRoleEditor(createRoleEditorState());
  };

  const handlePermissionToggle = (permissionKey: string) => {
    setRoleEditor((prev) => ({
      ...prev,
      permissions: toggleValue(prev.permissions, permissionKey).sort(),
    }));
  };

  const handleRoleSubmit = async () => {
    const name = roleEditor.name.trim();
    const key = roleEditor.key.trim().toLowerCase();

    if (!name || (roleEditor.mode === "create" && !key)) {
      return;
    }

    try {
      if (roleEditor.mode === "create") {
        await onCreateRole({
          key,
          name,
          description: roleEditor.description.trim(),
          permissions: roleEditor.permissions,
        });
        closeRoleEditor();
        return;
      }

      if (roleEditor.id === null) {
        return;
      }

      await onUpdateRole(roleEditor.id, {
        name,
        description: roleEditor.description.trim(),
        permissions: roleEditor.permissions,
      });
      closeRoleEditor();
    } catch {
      return;
    }
  };

  const handleRoleDelete = async () => {
    if (roleEditor.id === null) {
      return;
    }

    const role = roles.find((item) => item.id === roleEditor.id);
    if (!role || role.is_system) {
      return;
    }

    if (!window.confirm(`Удалить роль «${role.name}»?`)) {
      return;
    }

    try {
      await onDeleteRole(role);
      closeRoleEditor();
    } catch {
      return;
    }
  };

  const handleUserRoleToggle = (roleKey: string) => {
    if (!selectedUser) {
      return;
    }

    setUserRoleDrafts((prev) => ({
      ...prev,
      [selectedUser.id]: toggleValue(
        prev[selectedUser.id] ?? selectedUser.assigned_roles.map((role) => role.key),
        roleKey,
      ).sort(),
    }));
  };

  const handleUserRolesSave = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      await onUpdateUserRoles(selectedUser, selectedUserRoleKeys);
    } catch {
      return;
    }
  };

  return (
    <div className={scss.panel}>
      <div className={scss.panelHead}>
        <div>
          <h2>Пользователи и доступы</h2>
          <p className={scss.panelNote}>
            Управление ролями идёт поверх legacy-ролей без слома текущего доступа.
          </p>
        </div>
        {canManageUsers && (
          <button type="button" onClick={startCreateRole}>
            <FiPlus />
            Новая роль
          </button>
        )}
      </div>

      <div className={scss.userFilters} role="search" aria-label="Фильтры пользователей">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Поиск по имени, email, телефону или username"
          aria-label="Поиск по имени, email, телефону или username"
        />
        <select
          aria-label="Сортировка пользователей"
          value={sorting}
          onChange={(event) =>
            onSortChange(
              event.target.value as
                | "newest"
                | "oldest"
                | "email_asc"
                | "email_desc"
                | "name_asc"
                | "name_desc",
            )
          }
        >
          {Object.entries(USER_SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Фильтр по базовой роли"
          value={roleFilter}
          onChange={(event) => onRoleFilterChange(event.target.value as AdminRole | "all")}
        >
          <option value="all">Все базовые роли</option>
          <option value="customer">Клиент</option>
          <option value="manager">Менеджер</option>
          <option value="admin">Администратор</option>
          <option value="owner">Владелец</option>
        </select>
        <select
          aria-label="Фильтр по активности пользователя"
          value={activeFilter}
          onChange={(event) =>
            onActiveFilterChange(event.target.value as "all" | "active" | "inactive")
          }
        >
          <option value="all">Все статусы</option>
          <option value="active">Только активные</option>
          <option value="inactive">Только неактивные</option>
        </select>
        <button type="button" className={scss.secondaryAction} onClick={onResetListFilters}>
          Сбросить фильтры
        </button>
      </div>

      <div className={scss.rbacGrid}>
        <section className={scss.softCard}>
          <div className={scss.softCardHead}>
            <h3>Роли</h3>
            <span>{roles.length}</span>
          </div>
          <div className={scss.roleGrid}>
            {roles.length ? (
              roles.map((role) => (
                <article key={role.id} className={scss.roleCard}>
                  <div className={scss.roleCardHead}>
                    <div>
                      <strong>{role.name}</strong>
                      <span>{role.key}</span>
                    </div>
                    {canManageUsers && (
                      <div className={scss.rowActions}>
                        <button
                          type="button"
                          className={scss.iconButton}
                          aria-label={`Редактировать роль ${role.name}`}
                          onClick={() => startEditRole(role)}
                        >
                          <FiEdit2 />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className={scss.mutedText}>{role.description || "Описание не задано."}</p>
                  <div className={scss.roleMetaRow}>
                    <span>Пользователей: {role.user_count}</span>
                    <span>{role.is_system ? "Системная роль" : "Пользовательская роль"}</span>
                  </div>
                  <div className={scss.tagList}>
                    {role.permissions.length ? (
                      role.permissions.map((permission) => (
                        <span key={permission.key} className={scss.tag} title={permission.description}>
                          {permission.name}
                        </span>
                      ))
                    ) : (
                      <span className={scss.mutedText}>Без дополнительных разрешений</span>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <p className={scss.mutedText}>Роли ещё не загружены.</p>
            )}
          </div>
        </section>

        <section className={scss.softCard}>
          <div className={scss.softCardHead}>
            <h3>{editingRoleId === null ? "Редактор роли" : roleEditor.mode === "create" ? "Новая роль" : "Редактирование роли"}</h3>
            {editingRoleId !== null && (
              <button type="button" className={scss.secondaryAction} onClick={closeRoleEditor}>
                Закрыть
              </button>
            )}
          </div>

          {editingRoleId === null ? (
            <p className={scss.mutedText}>Выберите роль для редактирования или создайте новую.</p>
          ) : (
            <div className={scss.roleEditor}>
              <div className={scss.fieldGrid}>
                <label className={scss.formField}>
                  <span>Ключ роли</span>
                  <input
                    value={roleEditor.key}
                    onChange={(event) =>
                      setRoleEditor((prev) => ({ ...prev, key: event.target.value }))
                    }
                    placeholder="content-manager"
                    disabled={roleEditor.mode === "edit"}
                  />
                </label>
                <label className={scss.formField}>
                  <span>Название</span>
                  <input
                    value={roleEditor.name}
                    onChange={(event) =>
                      setRoleEditor((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="Контент-менеджер"
                  />
                </label>
              </div>

              <label className={scss.formField}>
                <span>Описание</span>
                <textarea
                  value={roleEditor.description}
                  onChange={(event) =>
                    setRoleEditor((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Для кого эта роль и что она может делать"
                />
              </label>

              <div className={scss.permissionGrid}>
                {permissions.map((permission) => (
                  <label key={permission.key} className={scss.permissionItem}>
                    <input
                      type="checkbox"
                      checked={roleEditor.permissions.includes(permission.key)}
                      onChange={() => handlePermissionToggle(permission.key)}
                    />
                    <div>
                      <strong>{permission.name}</strong>
                      <span>{permission.description}</span>
                    </div>
                  </label>
                ))}
              </div>

              {isEditingSystemRole && (
                <p className={scss.mutedText}>
                  Системные роли синхронизируются из backend и доступны здесь только для просмотра.
                </p>
              )}

              <div className={scss.modalActions}>
                {roleEditor.mode === "edit" && !isEditingSystemRole && (
                  <button
                    type="button"
                    className={scss.danger}
                    onClick={handleRoleDelete}
                    disabled={!canManageUsers || isRoleMutationLoading}
                  >
                    <FiTrash2 />
                    Удалить роль
                  </button>
                )}
                <button
                  type="button"
                  className={scss.secondary}
                  onClick={closeRoleEditor}
                  disabled={isRoleMutationLoading}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleRoleSubmit}
                  disabled={!canManageUsers || isRoleMutationLoading || isEditingSystemRole}
                >
                  <FiShield />
                  {roleEditor.mode === "create" ? "Создать роль" : "Сохранить роль"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className={scss.usersShell}>
        <div className={scss.tableWrap}>
          <table>
            <caption className={scss.srOnly}>Таблица пользователей</caption>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Пользователь</th>
                <th scope="col">Базовая роль</th>
                <th scope="col">Доп. роли</th>
                <th scope="col">Заказы</th>
                <th scope="col">Потрачено</th>
                <th scope="col">Последний заказ</th>
                <th scope="col">Доступ</th>
              </tr>
            </thead>
            <tbody>
              {users.results.length ? (
                users.results.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      <div className={scss.userIdentity}>
                        <strong>{`${item.first_name} ${item.last_name}`.trim() || item.email}</strong>
                        <span>{item.email}</span>
                        <span>{item.phone_number || "Телефон не указан"}</span>
                      </div>
                    </td>
                    <td>{formatRoleLabel(item.legacy_role || item.role)}</td>
                    <td>
                      <div className={scss.tagList}>
                        {item.assigned_roles.length ? (
                          item.assigned_roles.map((role) => (
                            <span key={role.key} className={scss.tag}>
                              {role.name}
                            </span>
                          ))
                        ) : (
                          <span className={scss.mutedText}>Нет</span>
                        )}
                      </div>
                    </td>
                    <td>{item.total_orders}</td>
                    <td>{formatMoney(item.total_spent)}</td>
                    <td>{item.last_order_at ? formatDate(item.last_order_at) : "—"}</td>
                    <td>
                      <button
                        type="button"
                        className={scss.action}
                        onClick={() => setSelectedUserId(item.id)}
                      >
                        <FiUserCheck />
                        Доступ
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>Пользователи не найдены.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <section className={scss.softCard}>
          <div className={scss.softCardHead}>
            <h3>Доступ пользователя</h3>
            {selectedUser && <span>ID {selectedUser.id}</span>}
          </div>

          {selectedUser ? (
            <div className={scss.userAccessCard}>
              <div className={scss.userIdentity}>
                <strong>{`${selectedUser.first_name} ${selectedUser.last_name}`.trim() || selectedUser.email}</strong>
                <span>{selectedUser.email}</span>
                <span>Базовая роль: {formatRoleLabel(selectedUser.legacy_role || selectedUser.role)}</span>
              </div>

              <div className={scss.permissionGrid}>
                {roles.map((role) => (
                  <label key={role.id} className={scss.permissionItem}>
                    <input
                      type="checkbox"
                      checked={selectedUserRoleKeys.includes(role.key)}
                      onChange={() => handleUserRoleToggle(role.key)}
                      disabled={!canManageUsers}
                    />
                    <div>
                      <strong>{role.name}</strong>
                      <span>{role.description || role.key}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div>
                <strong>Итоговые разрешения</strong>
                <div className={scss.tagList}>
                  {selectedUserPermissions.length ? (
                    selectedUserPermissions.map((permission) => (
                      <span key={permission.key} className={scss.tag} title={permission.description}>
                        {permission.name}
                      </span>
                    ))
                  ) : (
                    <span className={scss.mutedText}>Только базовая роль без дополнительных прав.</span>
                  )}
                </div>
              </div>

              <div className={scss.modalActions}>
                <button
                  type="button"
                  onClick={handleUserRolesSave}
                  disabled={!canManageUsers || isUpdatingUserRoles}
                >
                  Сохранить доступ
                </button>
              </div>
            </div>
          ) : (
            <p className={scss.mutedText}>Выберите пользователя из таблицы, чтобы изменить доступ.</p>
          )}
        </section>
      </div>

      <div className={scss.auditPager}>
        <span>
          Показано {rangeStart}-{rangeEnd} из {users.count}. Страница {currentPage} из {totalPages}
        </span>
        <div className={scss.orderPagerControls}>
          <label className={scss.pageSizeControl}>
            <span>Показывать</span>
            <select
              aria-label="Количество пользователей на странице"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <div className={scss.pageJump}>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageJumpValue}
              onChange={(event) => setPageJumpValue(event.target.value)}
              onBlur={handlePageJump}
              aria-label="Перейти к странице пользователей"
            />
            <button
              type="button"
              className={scss.secondaryAction}
              onClick={handlePageJump}
              aria-label="Перейти к выбранной странице пользователей"
            >
              Перейти
            </button>
          </div>
          <div className={scss.auditPagerActions}>
            <button
              type="button"
              className={scss.secondaryAction}
              disabled={!users.previous}
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="Предыдущая страница пользователей"
            >
              Назад
            </button>
            <button
              type="button"
              className={scss.secondaryAction}
              disabled={!users.next}
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="Следующая страница пользователей"
            >
              Далее
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
