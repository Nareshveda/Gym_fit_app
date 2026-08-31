"""Tests for the Locations/Branches module: listing is open to any
authenticated user, create/update/delete are owner/admin only.
"""

from __future__ import annotations

import pytest


def test_list_locations_requires_authentication(client):
    response = client.get("/api/v1/locations/")
    assert response.status_code == 401


def test_any_authenticated_role_can_list_locations(
    client, staff_headers, admin_headers
):
    client.post("/api/v1/locations/", json={"name": "Downtown"}, headers=admin_headers)

    response = client.get("/api/v1/locations/", headers=staff_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.parametrize("headers_fixture", ["staff_headers", "trainer_headers"])
def test_non_admin_roles_cannot_create_location(client, headers_fixture, request):
    headers = request.getfixturevalue(headers_fixture)
    response = client.post(
        "/api/v1/locations/", json={"name": "Uptown"}, headers=headers
    )
    assert response.status_code == 403


def test_admin_can_create_location(client, admin_headers):
    response = client.post(
        "/api/v1/locations/",
        json={"name": "Uptown Branch", "address": "123 Main St", "phone": "9876543210"},
        headers=admin_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Uptown Branch"
    assert body["is_active"] is True


def test_create_location_duplicate_name_returns_409(client, admin_headers):
    client.post("/api/v1/locations/", json={"name": "Uptown"}, headers=admin_headers)
    response = client.post(
        "/api/v1/locations/", json={"name": "Uptown"}, headers=admin_headers
    )
    assert response.status_code == 409


def test_admin_can_update_location(client, admin_headers):
    location = client.post(
        "/api/v1/locations/", json={"name": "Uptown"}, headers=admin_headers
    ).json()
    response = client.put(
        f"/api/v1/locations/{location['id']}",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_admin_can_delete_location(client, admin_headers):
    location = client.post(
        "/api/v1/locations/", json={"name": "Uptown"}, headers=admin_headers
    ).json()
    response = client.delete(
        f"/api/v1/locations/{location['id']}", headers=admin_headers
    )
    assert response.status_code == 204

    listing = client.get("/api/v1/locations/", headers=admin_headers)
    assert listing.json() == []


def test_deleting_location_unassigns_members_not_deletes_them(
    client, db_session, staff_user, staff_headers, admin_headers
):
    from tests.conftest import make_member

    location = client.post(
        "/api/v1/locations/", json={"name": "Uptown"}, headers=admin_headers
    ).json()
    member = make_member(
        db_session, enrolled_by=staff_user.id, location_id=location["id"]
    )

    response = client.delete(
        f"/api/v1/locations/{location['id']}", headers=admin_headers
    )
    assert response.status_code == 204

    fetched = client.get(f"/api/v1/members/{member.id}", headers=staff_headers)
    assert fetched.status_code == 200
    assert fetched.json()["location_id"] is None


def test_delete_nonexistent_location_returns_404(client, admin_headers):
    response = client.delete("/api/v1/locations/999999", headers=admin_headers)
    assert response.status_code == 404
