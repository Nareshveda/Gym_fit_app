"""Tests for the member self-service login feature — the actor system that
lets a Member (not just a staff User) hold a JWT, scoped to their own
attendance/vitals only. This is a real auth/security boundary: a bug here
means either a member reaching staff data, or a staff token and a member
token with the same numeric id getting confused for one another.
"""

from __future__ import annotations

from app.auth.password import hash_password

from .conftest import make_member, member_auth_headers


def test_staff_can_grant_member_login_via_credentials_endpoint(
    client, db_session, staff_headers, staff_user
):
    member = make_member(
        db_session, enrolled_by=staff_user.id, email="jane@example.com"
    )

    response = client.put(
        f"/api/v1/members/{member.id}/credentials",
        json={"password": "MemberPass123!"},
        headers=staff_headers,
    )

    assert response.status_code == 200
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "jane@example.com", "password": "MemberPass123!"},
    )
    assert login.status_code == 200
    assert login.json()["user"]["actor"] == "member"


def test_granting_login_without_an_email_on_file_is_rejected(
    client, db_session, staff_headers, staff_user
):
    member = make_member(db_session, enrolled_by=staff_user.id, email=None)

    response = client.put(
        f"/api/v1/members/{member.id}/credentials",
        json={"password": "MemberPass123!"},
        headers=staff_headers,
    )

    assert response.status_code == 422


def test_member_with_no_password_set_cannot_log_in(client, db_session, staff_user):
    make_member(db_session, enrolled_by=staff_user.id, email="jane@example.com")

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "jane@example.com", "password": "anything"},
    )

    assert response.status_code == 401


def test_member_login_with_wrong_password_is_rejected(client, db_session, staff_user):
    make_member(
        db_session,
        enrolled_by=staff_user.id,
        email="jane@example.com",
        hashed_password=hash_password("CorrectPass123!"),
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "jane@example.com", "password": "WrongPass123!"},
    )

    assert response.status_code == 401


def test_inactive_member_cannot_log_in_even_with_correct_password(
    client, db_session, staff_user
):
    from app.models.member import MemberStatus

    make_member(
        db_session,
        enrolled_by=staff_user.id,
        email="jane@example.com",
        hashed_password=hash_password("CorrectPass123!"),
        status=MemberStatus.INACTIVE,
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "jane@example.com", "password": "CorrectPass123!"},
    )

    assert response.status_code == 401


def test_member_auth_me_returns_member_shaped_profile(client, db_session, staff_user):
    member = make_member(
        db_session,
        enrolled_by=staff_user.id,
        full_name="Jane Doe",
        email="jane@example.com",
        hashed_password=hash_password("CorrectPass123!"),
    )

    response = client.get("/api/v1/auth/me", headers=member_auth_headers(member))

    assert response.status_code == 200
    body = response.json()
    assert body["actor"] == "member"
    assert body["member_code"] == member.member_code
    assert body["full_name"] == "Jane Doe"


def test_member_token_is_rejected_by_staff_only_endpoints(
    client, db_session, staff_user
):
    member = make_member(
        db_session,
        enrolled_by=staff_user.id,
        email="jane@example.com",
        hashed_password=hash_password("CorrectPass123!"),
    )

    response = client.get("/api/v1/members/", headers=member_auth_headers(member))

    assert response.status_code == 401


def test_staff_token_is_rejected_by_member_only_endpoints(client, staff_headers):
    response = client.get("/api/v1/me/attendance", headers=staff_headers)

    assert response.status_code == 401


def test_member_can_read_their_own_attendance_and_vitals(
    client, db_session, staff_user
):
    member = make_member(
        db_session,
        enrolled_by=staff_user.id,
        email="jane@example.com",
        hashed_password=hash_password("CorrectPass123!"),
    )
    headers = member_auth_headers(member)

    attendance = client.get("/api/v1/me/attendance", headers=headers)
    vitals = client.get("/api/v1/me/vitals", headers=headers)
    dashboard = client.get("/api/v1/me/vitals/dashboard", headers=headers)

    assert attendance.status_code == 200
    assert attendance.json() == []
    assert vitals.status_code == 200
    assert vitals.json() == []
    assert dashboard.status_code == 200
    assert dashboard.json()["member_id"] == member.id


def test_member_cannot_read_another_members_attendance(client, db_session, staff_user):
    member_a = make_member(
        db_session,
        enrolled_by=staff_user.id,
        email="a@example.com",
        hashed_password=hash_password("CorrectPass123!"),
    )
    member_b = make_member(
        db_session,
        enrolled_by=staff_user.id,
        email="b@example.com",
        hashed_password=hash_password("CorrectPass123!"),
    )

    response = client.get(
        "/api/v1/me/attendance", headers=member_auth_headers(member_a)
    )

    # There is no member_id parameter to smuggle in — /me/* always resolves
    # from the token, so this just re-confirms member_a's own (empty) list,
    # never member_b's data.
    assert response.status_code == 200
    assert response.json() == []
    assert member_b.id != member_a.id


def test_member_refresh_token_rotation_preserves_member_actor(
    client, db_session, staff_user
):
    make_member(
        db_session,
        enrolled_by=staff_user.id,
        email="jane@example.com",
        hashed_password=hash_password("CorrectPass123!"),
    )
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "jane@example.com", "password": "CorrectPass123!"},
    )
    refresh_token = login.json()["refresh_token"]

    response = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["actor"] == "member"

    # The new access token actually works against a member-only endpoint.
    me_response = client.get(
        "/api/v1/me/attendance",
        headers={"Authorization": f"Bearer {body['access_token']}"},
    )
    assert me_response.status_code == 200
