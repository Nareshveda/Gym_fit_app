"""Tests for the shared profile-picture upload endpoint (POST
/api/v1/auth/me/avatar) — used by both staff Users and self-service Members.
"""

from __future__ import annotations

from app.auth.password import hash_password

from .conftest import make_member, member_auth_headers

_PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"fake but good enough for a content-type check"


def test_avatar_upload_requires_authentication(client, upload_dir):
    response = client.post(
        "/api/v1/auth/me/avatar",
        files={"file": ("me.png", _PNG_BYTES, "image/png")},
    )
    assert response.status_code == 401


def test_staff_can_upload_own_avatar(client, staff_headers, upload_dir):
    response = client.post(
        "/api/v1/auth/me/avatar",
        files={"file": ("me.png", _PNG_BYTES, "image/png")},
        headers=staff_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["actor"] == "staff"
    assert body["avatar_url"].startswith("/uploads/avatars/")

    me = client.get("/api/v1/auth/me", headers=staff_headers)
    assert me.json()["avatar_url"] == body["avatar_url"]


def test_member_can_upload_own_avatar(client, db_session, staff_user, upload_dir):
    member = make_member(
        db_session,
        enrolled_by=staff_user.id,
        email="jane@example.com",
        hashed_password=hash_password("CorrectPass123!"),
    )
    headers = member_auth_headers(member)

    response = client.post(
        "/api/v1/auth/me/avatar",
        files={"file": ("me.jpg", _PNG_BYTES, "image/jpeg")},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["actor"] == "member"
    assert body["avatar_url"].startswith("/uploads/avatars/")


def test_avatar_upload_rejects_non_image_files(client, staff_headers, upload_dir):
    response = client.post(
        "/api/v1/auth/me/avatar",
        files={"file": ("resume.pdf", b"%PDF-1.4 fake", "application/pdf")},
        headers=staff_headers,
    )

    assert response.status_code == 422
