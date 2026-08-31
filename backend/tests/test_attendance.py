"""Tests for the Attendance module: check-in/check-out edge cases from
CLAUDE.md ("A member cannot check in twice without checking out first").
"""

from __future__ import annotations

from tests.conftest import make_member


def test_check_in_creates_open_attendance_record(
    client, db_session, staff_user, staff_headers
):
    member = make_member(db_session, enrolled_by=staff_user.id)

    response = client.post(
        "/api/v1/attendance/check-in",
        json={"member_id": member.id},
        headers=staff_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["member_id"] == member.id
    assert body["check_out_time"] is None


def test_duplicate_check_in_without_check_out_is_rejected(
    client, db_session, staff_user, staff_headers
):
    member = make_member(db_session, enrolled_by=staff_user.id)

    first = client.post(
        "/api/v1/attendance/check-in",
        json={"member_id": member.id},
        headers=staff_headers,
    )
    assert first.status_code == 201

    second = client.post(
        "/api/v1/attendance/check-in",
        json={"member_id": member.id},
        headers=staff_headers,
    )
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "CONFLICT"


def test_check_in_unknown_member_returns_404(client, staff_headers):
    response = client.post(
        "/api/v1/attendance/check-in", json={"member_id": 999999}, headers=staff_headers
    )
    assert response.status_code == 404


def test_check_out_closes_the_record(client, db_session, staff_user, staff_headers):
    member = make_member(db_session, enrolled_by=staff_user.id)
    check_in = client.post(
        "/api/v1/attendance/check-in",
        json={"member_id": member.id},
        headers=staff_headers,
    ).json()

    response = client.put(
        f"/api/v1/attendance/{check_in['id']}/check-out", headers=staff_headers
    )
    assert response.status_code == 200
    assert response.json()["check_out_time"] is not None


def test_double_check_out_is_rejected(client, db_session, staff_user, staff_headers):
    member = make_member(db_session, enrolled_by=staff_user.id)
    check_in = client.post(
        "/api/v1/attendance/check-in",
        json={"member_id": member.id},
        headers=staff_headers,
    ).json()
    client.put(f"/api/v1/attendance/{check_in['id']}/check-out", headers=staff_headers)

    second = client.put(
        f"/api/v1/attendance/{check_in['id']}/check-out", headers=staff_headers
    )
    assert second.status_code == 409


def test_check_in_again_after_check_out_is_allowed(
    client, db_session, staff_user, staff_headers
):
    member = make_member(db_session, enrolled_by=staff_user.id)
    check_in = client.post(
        "/api/v1/attendance/check-in",
        json={"member_id": member.id},
        headers=staff_headers,
    ).json()
    client.put(f"/api/v1/attendance/{check_in['id']}/check-out", headers=staff_headers)

    second_check_in = client.post(
        "/api/v1/attendance/check-in",
        json={"member_id": member.id},
        headers=staff_headers,
    )
    assert second_check_in.status_code == 201
    assert second_check_in.json()["id"] != check_in["id"]
