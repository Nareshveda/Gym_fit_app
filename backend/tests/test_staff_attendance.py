"""Tests for the Staff Attendance module — mirrors test_attendance.py's
member check-in/out edge cases, but for staff/trainer users."""

from __future__ import annotations


def test_check_in_defaults_to_the_caller(client, staff_user, staff_headers):
    response = client.post(
        "/api/v1/staff-attendance/check-in", json={}, headers=staff_headers
    )
    assert response.status_code == 201
    body = response.json()
    assert body["staff_id"] == staff_user.id
    assert body["staff_name"] == staff_user.full_name
    assert body["check_out_time"] is None


def test_check_in_specific_staff_id(client, staff_user, trainer_user, staff_headers):
    response = client.post(
        "/api/v1/staff-attendance/check-in",
        json={"staff_id": trainer_user.id},
        headers=staff_headers,
    )
    assert response.status_code == 201
    assert response.json()["staff_id"] == trainer_user.id


def test_duplicate_check_in_without_check_out_is_rejected(client, staff_headers):
    first = client.post(
        "/api/v1/staff-attendance/check-in", json={}, headers=staff_headers
    )
    assert first.status_code == 201

    second = client.post(
        "/api/v1/staff-attendance/check-in", json={}, headers=staff_headers
    )
    assert second.status_code == 409


def test_check_in_unknown_staff_returns_404(client, staff_headers):
    response = client.post(
        "/api/v1/staff-attendance/check-in",
        json={"staff_id": 999999},
        headers=staff_headers,
    )
    assert response.status_code == 404


def test_check_out_closes_the_record(client, staff_headers):
    check_in = client.post(
        "/api/v1/staff-attendance/check-in", json={}, headers=staff_headers
    ).json()

    response = client.put(
        f"/api/v1/staff-attendance/{check_in['id']}/check-out", headers=staff_headers
    )
    assert response.status_code == 200
    assert response.json()["check_out_time"] is not None


def test_double_check_out_is_rejected(client, staff_headers):
    check_in = client.post(
        "/api/v1/staff-attendance/check-in", json={}, headers=staff_headers
    ).json()
    client.put(
        f"/api/v1/staff-attendance/{check_in['id']}/check-out", headers=staff_headers
    )

    second = client.put(
        f"/api/v1/staff-attendance/{check_in['id']}/check-out", headers=staff_headers
    )
    assert second.status_code == 409


def test_list_attendance_filters_by_staff_id(
    client, staff_user, trainer_user, staff_headers, trainer_headers
):
    client.post("/api/v1/staff-attendance/check-in", json={}, headers=staff_headers)
    client.post("/api/v1/staff-attendance/check-in", json={}, headers=trainer_headers)

    response = client.get(
        "/api/v1/staff-attendance/",
        params={"staff_id": trainer_user.id},
        headers=staff_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["staff_id"] == trainer_user.id


def test_staff_directory_lists_active_users(
    client, staff_user, admin_user, staff_headers
):
    response = client.get("/api/v1/staff/", headers=staff_headers)
    assert response.status_code == 200
    ids = {item["id"] for item in response.json()}
    assert staff_user.id in ids
    assert admin_user.id in ids
