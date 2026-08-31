"""Tests for member vitals (progress tracking): recording readings, BMI
computation, height carry-forward, and the dashboard's baseline/latest deltas.
"""

from __future__ import annotations

from tests.conftest import make_member


def test_record_vital_computes_bmi(client, db_session, staff_user, staff_headers):
    member = make_member(db_session, enrolled_by=staff_user.id)

    response = client.post(
        f"/api/v1/members/{member.id}/vitals",
        json={"height_cm": "180.0", "weight_kg": "81.0"},
        headers=staff_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["member_id"] == member.id
    # BMI = 81 / 1.8^2 = 25.0
    assert body["bmi"] == "25.0"


def test_record_vital_for_unknown_member_returns_404(client, staff_headers):
    response = client.post(
        "/api/v1/members/999999/vitals",
        json={"weight_kg": "70.0"},
        headers=staff_headers,
    )
    assert response.status_code == 404


def test_record_vital_without_height_reuses_last_known_height(
    client, db_session, staff_user, staff_headers
):
    member = make_member(db_session, enrolled_by=staff_user.id)

    client.post(
        f"/api/v1/members/{member.id}/vitals",
        json={"height_cm": "170.0", "weight_kg": "70.0"},
        headers=staff_headers,
    )
    second = client.post(
        f"/api/v1/members/{member.id}/vitals",
        json={"weight_kg": "68.0"},
        headers=staff_headers,
    )
    assert second.status_code == 201
    body = second.json()
    assert body["height_cm"] == "170.0"


def test_list_vitals_ordered_oldest_first(
    client, db_session, staff_user, staff_headers
):
    member = make_member(db_session, enrolled_by=staff_user.id)

    client.post(
        f"/api/v1/members/{member.id}/vitals",
        json={"recorded_at": "2026-01-01", "height_cm": "170.0", "weight_kg": "75.0"},
        headers=staff_headers,
    )
    client.post(
        f"/api/v1/members/{member.id}/vitals",
        json={"recorded_at": "2026-02-01", "weight_kg": "73.0"},
        headers=staff_headers,
    )

    response = client.get(f"/api/v1/members/{member.id}/vitals", headers=staff_headers)
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0]["recorded_at"] == "2026-01-01"
    assert body[1]["recorded_at"] == "2026-02-01"


def test_vitals_dashboard_reports_weight_change_from_baseline(
    client, db_session, staff_user, staff_headers
):
    member = make_member(db_session, enrolled_by=staff_user.id)

    client.post(
        f"/api/v1/members/{member.id}/vitals",
        json={"recorded_at": "2026-01-01", "height_cm": "170.0", "weight_kg": "75.0"},
        headers=staff_headers,
    )
    client.post(
        f"/api/v1/members/{member.id}/vitals",
        json={"recorded_at": "2026-02-01", "weight_kg": "70.0"},
        headers=staff_headers,
    )

    response = client.get(
        f"/api/v1/members/{member.id}/vitals/dashboard", headers=staff_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["baseline"]["weight_kg"] == "75.0"
    assert body["latest"]["weight_kg"] == "70.0"
    assert body["weight_change_kg"] == "-5.0"


def test_vitals_dashboard_with_no_readings_returns_nulls(
    client, db_session, staff_user, staff_headers
):
    member = make_member(db_session, enrolled_by=staff_user.id)

    response = client.get(
        f"/api/v1/members/{member.id}/vitals/dashboard", headers=staff_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["history"] == []
    assert body["baseline"] is None
    assert body["latest"] is None
