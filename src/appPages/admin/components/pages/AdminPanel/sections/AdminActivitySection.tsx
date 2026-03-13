"use client";

import scss from "../AdminPanel.module.scss";
import { formatDate, formatRoleLabel } from "../AdminPanel.shared";

type AdminActivitySectionProps = {
  activities: AdminPaginatedResponse<AdminActivityEvent>;
};

export const AdminActivitySection = ({ activities }: AdminActivitySectionProps) => (
  <div className={scss.panel}>
    <h2>События</h2>
    {activities.results.length ? (
      <ul className={scss.activity}>
        {activities.results.map((item) => (
          <li key={item.id}>
            <div>
              <strong>{item.entity_label}</strong>
              <span>{formatDate(item.created_at)}</span>
            </div>
            <p>{item.message}</p>
            <small>
              {item.actor.name} В· {formatRoleLabel(item.actor.role)}
            </small>
          </li>
        ))}
      </ul>
    ) : (
      <div className={scss.tableWrap}>
        <table>
          <tbody>
            <tr>
              <td>События не найдены.</td>
            </tr>
          </tbody>
        </table>
      </div>
    )}
  </div>
);
