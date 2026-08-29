"""Tests for role-based access on `/admin/*`, per CLAUDE.md ("Only users with
role `owner` or `admin` may access `/admin/*` endpoints") and the
self-demotion guard in `admin_service.update_user`.
"""
from __future__ import annotations

import pytest


@pytest.mark.parametrize("headers_fixture", ["staff_headers", "trainer_headers"])
def test_non_admin_roles_are_forbidden_from_admin_endpoints(client, headers_fixture, request):
    headers = request.getfixturevalue(headers_fixture)
    response = client.get("/api/v1/admin/users", headers=headers)
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.parametrize("headers_fixture", ["admin_headers", "owner_headers"])
def test_admin_and_owner_can_list_users(client, headers_fixture, request):
    headers = request.getfixturevalue(headers_fixture)
    response = client.get("/api/v1/admin/users", headers=headers)
    assert response.status_code == 200


def test_admin_endpoints_require_authentication(client):
    response = client.get("/api/v1/admin/users")
    assert response.status_code == 401


def test_admin_can_change_another_users_role(client, admin_headers, staff_user):
    response = client.put(
        f"/api/v1/admin/users/{staff_user.id}", json={"role": "trainer"}, headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json()["role"] == "trainer"


def test_admin_cannot_demote_themselves(client, admin_headers, admin_user):
    response = client.put(
        f"/api/v1/admin/users/{admin_user.id}", json={"role": "staff"}, headers=admin_headers
    )
    assert response.status_code == 409


def test_admin_cannot_deactivate_themselves(client, admin_headers, admin_user):
    response = client.put(
        f"/api/v1/admin/users/{admin_user.id}", json={"is_active": False}, headers=admin_headers
    )
    assert response.status_code == 409


def test_admin_can_deactivate_another_admin(client, db_session, admin_headers):
    from tests.conftest import make_user
    from app.models.user import UserRole

    other_admin = make_user(db_session, role=UserRole.ADMIN, email="other-admin@example.com")

    response = client.put(
        f"/api/v1/admin/users/{other_admin.id}", json={"is_active": False}, headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False
