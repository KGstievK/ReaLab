"use client";

import scss from "../AdminPanel.module.scss";
import { formatMoney, formatRoleLabel } from "../AdminPanel.shared";

type AdminUsersSectionProps = {
  users: AdminPaginatedResponse<AdminUser>;
};

export const AdminUsersSection = ({ users }: AdminUsersSectionProps) => (
  <div className={scss.panel}>
    <h2>Пользователи</h2>
    <div className={scss.tableWrap}>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Почта</th>
            <th>Роль</th>
            <th>Заказы</th>
            <th>Потрачено</th>
          </tr>
        </thead>
        <tbody>
          {users.results.length ? (
            users.results.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>
                  {item.first_name} {item.last_name}
                </td>
                <td>{item.email}</td>
                <td>{formatRoleLabel(item.role)}</td>
                <td>{item.total_orders}</td>
                <td>{formatMoney(item.total_spent)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6}>Пользователи не найдены.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);
