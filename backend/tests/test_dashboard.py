"""Tests for the Dashboard module's aggregate stats (GET /api/v1/dashboard/stats) —
member/plan/location counts, revenue, and the "most active" / "at risk" member
insights, all computed fresh per request from the other modules' data.
"""

from __future__ import annotations

from datetime import date

from app.models.member import MemberStatus

from .conftest import make_member, make_plan


def test_dashboard_requires_authentication(client):
    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 401


def test_empty_database_returns_zeroed_stats(client, staff_headers):
    response = client.get("/api/v1/dashboard/stats", headers=staff_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total_members"] == 0
    assert body["active_members"] == 0
    assert body["attendance_today"] == 0
    assert body["revenue_this_month"] == "0"
    assert body["most_active_member"] is None
    assert body["at_risk_members"] == []
    assert body["at_risk_count"] == 0
    assert body["plan_split"] == []
    assert body["members_by_location"] == []


def test_total_and_active_member_counts_reflect_status(
    client, db_session, staff_user, staff_headers
):
    make_member(db_session, enrolled_by=staff_user.id, status=MemberStatus.ACTIVE)
    make_member(db_session, enrolled_by=staff_user.id, status=MemberStatus.ACTIVE)
    make_member(db_session, enrolled_by=staff_user.id, status=MemberStatus.INACTIVE)

    response = client.get("/api/v1/dashboard/stats", headers=staff_headers)

    body = response.json()
    assert body["total_members"] == 3
    assert body["active_members"] == 2


def test_plan_split_groups_by_current_plan_including_no_plan_bucket(
    client, db_session, staff_user, staff_headers
):
    with_plan = make_member(db_session, enrolled_by=staff_user.id)
    make_member(db_session, enrolled_by=staff_user.id)  # no subscription at all
    plan = make_plan(db_session, name="Winners")
    client.post(
        f"/api/v1/members/{with_plan.id}/subscriptions",
        json={"plan_id": plan.id},
        headers=staff_headers,
    )

    response = client.get("/api/v1/dashboard/stats", headers=staff_headers)

    plan_split = {
        row["plan_name"]: row["member_count"] for row in response.json()["plan_split"]
    }
    assert plan_split == {"Winners": 1, "No Plan": 1}


def test_members_by_location_includes_unassigned_bucket(
    client, db_session, staff_user, staff_headers, admin_headers
):
    # Creating a location is owner/admin-only; enrolling the members against
    # it isn't role-gated, so staff_headers is still used for those.
    location = client.post(
        "/api/v1/locations/", json={"name": "Main Branch"}, headers=admin_headers
    ).json()
    make_member(db_session, enrolled_by=staff_user.id, location_id=location["id"])
    make_member(db_session, enrolled_by=staff_user.id, location_id=None)

    response = client.get("/api/v1/dashboard/stats", headers=staff_headers)

    by_location = {
        row["location_name"]: row["member_count"]
        for row in response.json()["members_by_location"]
    }
    assert by_location == {"Main Branch": 1, "Unassigned": 1}


def test_most_active_member_is_whoever_checked_in_more_today(
    client, db_session, staff_user, staff_headers
):
    busy = make_member(db_session, enrolled_by=staff_user.id, full_name="Busy Bee")
    quiet = make_member(db_session, enrolled_by=staff_user.id, full_name="Quiet Quinn")

    # `busy` checks in/out twice today; a member can re-check-in only after
    # checking out, so this exercises that same "no duplicate open check-in"
    # rule while building up today's visit count.
    for _ in range(2):
        checkin = client.post(
            "/api/v1/attendance/check-in",
            json={"member_id": busy.id},
            headers=staff_headers,
        ).json()
        client.put(
            f"/api/v1/attendance/{checkin['id']}/check-out", headers=staff_headers
        )
    client.post(
        "/api/v1/attendance/check-in",
        json={"member_id": quiet.id},
        headers=staff_headers,
    )

    response = client.get("/api/v1/dashboard/stats", headers=staff_headers)

    most_active = response.json()["most_active_member"]
    assert most_active["member_id"] == busy.id
    assert most_active["visit_count"] == 2


def test_at_risk_members_excludes_whoever_checked_in_today(
    client, db_session, staff_user, staff_headers
):
    checked_in = make_member(
        db_session, enrolled_by=staff_user.id, full_name="Checked In"
    )
    never_checked_in = make_member(
        db_session, enrolled_by=staff_user.id, full_name="Never Checked In"
    )
    client.post(
        "/api/v1/attendance/check-in",
        json={"member_id": checked_in.id},
        headers=staff_headers,
    )

    response = client.get("/api/v1/dashboard/stats", headers=staff_headers)

    body = response.json()
    assert body["at_risk_count"] == 1
    at_risk_ids = {row["member_id"] for row in body["at_risk_members"]}
    assert at_risk_ids == {never_checked_in.id}


def test_revenue_this_month_reflects_recorded_payments(
    client, db_session, staff_user, staff_headers
):
    member = make_member(db_session, enrolled_by=staff_user.id)
    plan = make_plan(db_session)
    subscription = client.post(
        f"/api/v1/members/{member.id}/subscriptions",
        json={"plan_id": plan.id},
        headers=staff_headers,
    ).json()
    client.post(
        "/api/v1/payments",
        json={
            "member_id": member.id,
            "subscription_id": subscription["id"],
            "amount": "500.00",
            "payment_method": "cash",
            "payment_date": date.today().isoformat(),
        },
        headers=staff_headers,
    )

    response = client.get("/api/v1/dashboard/stats", headers=staff_headers)

    assert response.json()["revenue_this_month"] == "500.00"
