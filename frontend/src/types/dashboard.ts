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

/** Active member headcount for one branch/location (or "Unassigned"). */
export interface LocationMemberCount {
  location_id: number | null;
  location_name: string;
  member_count: number;
}

/** New enrollments in a single calendar month, for a trend chart. */
export interface MonthlyNewMembers {
  /** "YYYY-MM" */
  month: string;
  count: number;
}

/** The member with the most check-ins in the trailing window. */
export interface MostActiveMember {
  member_id: number;
  member_name: string;
  visit_count: number;
}

/** An active member with no check-in in the trailing window — worth a nudge. */
export interface AtRiskMember {
  member_id: number;
  member_name: string;
  last_visit_date: string | null;
}

/** Active member count on one admin-created membership plan (or "No Plan"). */
export interface PlanMemberCount {
  plan_name: string;
  member_count: number;
}

/** Response shape for `GET /api/v1/dashboard/stats`. */
export interface DashboardStats {
  total_members: number;
  active_members: number;
  expiring_soon_count: number;
  overdue_count: number;
  /** Serialized as a JSON string by the backend (Decimal), not a number. */
  revenue_this_month: string;
  /** Serialized as a JSON string by the backend (Decimal), not a number. */
  revenue_last_month: string;
  attendance_today: number;
  attendance_this_week: number;
  expiring_soon: ExpiringSubscriptionItem[];
  members_by_location: LocationMemberCount[];
  new_members_by_month: MonthlyNewMembers[];
  most_active_member: MostActiveMember | null;
  at_risk_members: AtRiskMember[];
  at_risk_count: number;
  plan_split: PlanMemberCount[];
}
