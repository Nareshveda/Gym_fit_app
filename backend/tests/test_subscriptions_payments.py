"""Tests for the Fee Management module: due_date computation, payment
recording/renewal, and overdue/expiring_soon status transitions, per
CLAUDE.md's Fee Management module rules.
"""

from __future__ import annotations

from datetime import date, timedelta

from tests.conftest import make_member, make_plan


def test_assign_subscription_computes_due_date_from_duration_type(
    client, db_session, staff_user, staff_headers
):
    member = make_member(db_session, enrolled_by=staff_user.id)
    plan = make_plan(db_session)  # monthly, +30 days

    start = date.today()
    response = client.post(
        f"/api/v1/members/{member.id}/subscriptions",
        json={"plan_id": plan.id, "start_date": start.isoformat()},
        headers=staff_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["due_date"] == (start + timedelta(days=30)).isoformat()
    assert body["status"] == "active"


def test_assign_subscription_rejects_inactive_plan(
    client, db_session, staff_user, staff_headers
):
    member = make_member(db_session, enrolled_by=staff_user.id)
    plan = make_plan(db_session, is_active=False)

    response = client.post(
        f"/api/v1/members/{member.id}/subscriptions",
        json={"plan_id": plan.id},
        headers=staff_headers,
    )
    assert response.status_code == 422


def test_record_payment_rejects_non_positive_amount(
    client, db_session, staff_user, staff_headers
):
    member = make_member(db_session, enrolled_by=staff_user.id)
    plan = make_plan(db_session)
    subscription = client.post(
        f"/api/v1/members/{member.id}/subscriptions",
        json={"plan_id": plan.id},
        headers=staff_headers,
    ).json()

    response = client.post(
        "/api/v1/payments",
        json={
            "member_id": member.id,
            "subscription_id": subscription["id"],
            "amount": "0",
            "payment_method": "cash",
        },
        headers=staff_headers,
    )
    assert response.status_code == 422


def test_record_payment_advances_due_date_and_resets_status_to_active(
    client, db_session, staff_user, staff_headers
):
    member = make_member(db_session, enrolled_by=staff_user.id)
    plan = make_plan(db_session)
    # Backdate the subscription so it's already overdue before the payment.
    start = date.today() - timedelta(days=40)
    subscription = client.post(
        f"/api/v1/members/{member.id}/subscriptions",
        json={"plan_id": plan.id, "start_date": start.isoformat()},
        headers=staff_headers,
    ).json()
    assert subscription["due_date"] == (start + timedelta(days=30)).isoformat()

    payment = client.post(
        "/api/v1/payments",
        json={
            "member_id": member.id,
            "subscription_id": subscription["id"],
            "amount": "29.99",
            "payment_method": "cash",
        },
        headers=staff_headers,
    )
    assert payment.status_code == 201
    assert payment.json()["recorded_by"] == staff_user.id

    updated = client.get(
        f"/api/v1/members/{member.id}/subscriptions", headers=staff_headers
    ).json()[0]
    # Renewal is anchored to today (not the stale due_date) since the
    # subscription was overdue, so the new due_date is today + 30 days.
    assert updated["due_date"] == (date.today() + timedelta(days=30)).isoformat()
    assert updated["status"] == "active"


def test_record_payment_accepts_upi_with_reference_number(
    client, db_session, staff_user, staff_headers
):
    member = make_member(db_session, enrolled_by=staff_user.id)
    plan = make_plan(db_session)
    subscription = client.post(
        f"/api/v1/members/{member.id}/subscriptions",
        json={"plan_id": plan.id},
        headers=staff_headers,
    ).json()

    response = client.post(
        "/api/v1/payments",
        json={
            "member_id": member.id,
            "subscription_id": subscription["id"],
            "amount": "29.99",
            "payment_method": "upi",
            "reference_number": "UPI-TXN-12345",
        },
        headers=staff_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["payment_method"] == "upi"
    assert body["reference_number"] == "UPI-TXN-12345"


def test_record_payment_wrong_member_for_subscription_is_rejected(
    client, db_session, staff_user, staff_headers
):
    member_a = make_member(
        db_session, enrolled_by=staff_user.id, full_name="A", phone="1"
    )
    member_b = make_member(
        db_session,
        enrolled_by=staff_user.id,
        full_name="B",
        phone="2",
        email="b@example.com",
    )
    plan = make_plan(db_session)
    subscription = client.post(
        f"/api/v1/members/{member_a.id}/subscriptions",
        json={"plan_id": plan.id},
        headers=staff_headers,
    ).json()

    response = client.post(
        "/api/v1/payments",
        json={
            "member_id": member_b.id,
            "subscription_id": subscription["id"],
            "amount": "10",
            "payment_method": "cash",
        },
        headers=staff_headers,
    )
    assert response.status_code == 422


def test_overdue_and_expiring_soon_subscriptions_are_flagged(
    client, db_session, staff_user, staff_headers
):
    plan = make_plan(db_session)  # monthly, +30 days

    overdue_member = make_member(
        db_session, enrolled_by=staff_user.id, full_name="Overdue", phone="3"
    )
    client.post(
        f"/api/v1/members/{overdue_member.id}/subscriptions",
        json={
            "plan_id": plan.id,
            "start_date": (date.today() - timedelta(days=40)).isoformat(),
        },
        headers=staff_headers,
    )

    expiring_member = make_member(
        db_session,
        enrolled_by=staff_user.id,
        full_name="Expiring",
        phone="4",
        email="expiring@example.com",
    )
    client.post(
        f"/api/v1/members/{expiring_member.id}/subscriptions",
        json={
            "plan_id": plan.id,
            "start_date": (date.today() - timedelta(days=27)).isoformat(),
        },
        headers=staff_headers,
    )

    healthy_member = make_member(
        db_session,
        enrolled_by=staff_user.id,
        full_name="Healthy",
        phone="5",
        email="healthy@example.com",
    )
    client.post(
        f"/api/v1/members/{healthy_member.id}/subscriptions",
        json={"plan_id": plan.id, "start_date": date.today().isoformat()},
        headers=staff_headers,
    )

    response = client.get("/api/v1/payments/overdue", headers=staff_headers)
    assert response.status_code == 200
    by_member = {row["member_id"]: row["status"] for row in response.json()}
    assert by_member[overdue_member.id] == "overdue"
    assert by_member[expiring_member.id] == "expiring_soon"
    assert healthy_member.id not in by_member
