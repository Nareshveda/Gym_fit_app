/**
 * Domain types for the Dashboard module. Kept separate from
 * `src/types/index.ts` per module ownership rules — mirrors
 * `backend/app/schemas/dashboard.py`'s `DashboardStatsResponse`.
 */

/** A single subscription nearing its due date, for the dashboard mini-list. */
export interface ExpiringSubscriptionItem {
  subscription_id: number;
  member_id: number;
  member_name: string;
  due_date: string;
}

/** Response shape for `GET /api/v1/dashboard/stats`. */
export interface DashboardStats {
  total_members: number;
  active_members: number;
  expiring_soon_count: number;
  overdue_count: number;
  revenue_this_month: number;
  attendance_today: number;
  expiring_soon: ExpiringSubscriptionItem[];
}
