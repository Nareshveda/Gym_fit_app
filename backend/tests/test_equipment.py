"""Tests for the Equipment/Inventory module — every endpoint is owner/admin
only, per "Add inventory page which would only be visible for the admin user."
"""

from __future__ import annotations

import pytest


def _equipment_payload(**overrides) -> dict:
    payload = {
        "name": "Treadmill X200",
        "brand": "LifeFit",
        "purchase_date": "2025-01-15",
        "amount": "85000.00",
        "warranty_details": "2 years, parts and labor",
        "service_schedule": "Quarterly",
        "notes": "Located near the entrance",
    }
    payload.update(overrides)
    return payload


@pytest.mark.parametrize("headers_fixture", ["staff_headers", "trainer_headers"])
def test_non_admin_roles_cannot_access_inventory(client, headers_fixture, request):
    headers = request.getfixturevalue(headers_fixture)
    assert client.get("/api/v1/equipment/", headers=headers).status_code == 403
    assert (
        client.post(
            "/api/v1/equipment/", json=_equipment_payload(), headers=headers
        ).status_code
        == 403
    )


def test_inventory_requires_authentication(client):
    response = client.get("/api/v1/equipment/")
    assert response.status_code == 401


def test_admin_can_create_and_list_equipment(client, admin_headers):
    response = client.post(
        "/api/v1/equipment/", json=_equipment_payload(), headers=admin_headers
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Treadmill X200"
    assert body["brand"] == "LifeFit"
    assert body["amount"] == "85000.00"
    assert body["locations"] == []

    listing = client.get("/api/v1/equipment/", headers=admin_headers)
    assert listing.status_code == 200
    assert len(listing.json()) == 1


def test_create_equipment_with_locations(client, admin_headers):
    loc_a = client.post(
        "/api/v1/locations/", json={"name": "Branch A"}, headers=admin_headers
    ).json()
    loc_b = client.post(
        "/api/v1/locations/", json={"name": "Branch B"}, headers=admin_headers
    ).json()

    response = client.post(
        "/api/v1/equipment/",
        json=_equipment_payload(location_ids=[loc_a["id"], loc_b["id"]]),
        headers=admin_headers,
    )
    assert response.status_code == 201
    location_names = {loc["name"] for loc in response.json()["locations"]}
    assert location_names == {"Branch A", "Branch B"}


def test_create_equipment_with_unknown_location_returns_404(client, admin_headers):
    response = client.post(
        "/api/v1/equipment/",
        json=_equipment_payload(location_ids=[999999]),
        headers=admin_headers,
    )
    assert response.status_code == 404


def test_admin_can_update_equipment_locations(client, admin_headers):
    loc_a = client.post(
        "/api/v1/locations/", json={"name": "Branch A"}, headers=admin_headers
    ).json()
    equipment = client.post(
        "/api/v1/equipment/",
        json=_equipment_payload(location_ids=[loc_a["id"]]),
        headers=admin_headers,
    ).json()

    response = client.put(
        f"/api/v1/equipment/{equipment['id']}",
        json={"location_ids": []},
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert response.json()["locations"] == []


def test_admin_can_delete_equipment(client, admin_headers):
    equipment = client.post(
        "/api/v1/equipment/", json=_equipment_payload(), headers=admin_headers
    ).json()
    response = client.delete(
        f"/api/v1/equipment/{equipment['id']}", headers=admin_headers
    )
    assert response.status_code == 204

    listing = client.get("/api/v1/equipment/", headers=admin_headers)
    assert listing.json() == []


def test_get_nonexistent_equipment_returns_404(client, admin_headers):
    response = client.get("/api/v1/equipment/999999", headers=admin_headers)
    assert response.status_code == 404


def test_admin_can_upload_and_retrieve_equipment_document(
    client, admin_headers, upload_dir
):
    equipment = client.post(
        "/api/v1/equipment/", json=_equipment_payload(), headers=admin_headers
    ).json()

    response = client.post(
        f"/api/v1/equipment/{equipment['id']}/document",
        files={"file": ("warranty.pdf", b"%PDF-1.4 fake", "application/pdf")},
        headers=admin_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["document_filename"] == "warranty.pdf"
    assert body["document_url"].startswith("/uploads/equipment/")

    # Actually written to disk with the right bytes — not verified via the
    # StaticFiles mount itself, since it captures `settings.UPLOAD_DIR` once
    # at app startup (before the `upload_dir` fixture patches it), so it
    # keeps serving from the real project `uploads/` dir in-process.
    stored_filename = body["document_url"].rsplit("/", 1)[-1]
    saved_file = upload_dir / "equipment" / stored_filename
    assert saved_file.read_bytes() == b"%PDF-1.4 fake"


def test_equipment_document_upload_rejects_unsupported_extension(
    client, admin_headers, upload_dir
):
    equipment = client.post(
        "/api/v1/equipment/", json=_equipment_payload(), headers=admin_headers
    ).json()

    response = client.post(
        f"/api/v1/equipment/{equipment['id']}/document",
        files={"file": ("virus.exe", b"not really an exe", "application/octet-stream")},
        headers=admin_headers,
    )

    assert response.status_code == 422


def test_equipment_document_upload_rejects_content_type_mismatch(
    client, admin_headers, upload_dir
):
    equipment = client.post(
        "/api/v1/equipment/", json=_equipment_payload(), headers=admin_headers
    ).json()

    # A .pdf filename but a content type that doesn't match it.
    response = client.post(
        f"/api/v1/equipment/{equipment['id']}/document",
        files={"file": ("warranty.pdf", b"not a pdf", "text/plain")},
        headers=admin_headers,
    )

    assert response.status_code == 422


def test_non_admin_cannot_upload_equipment_document(
    client, admin_headers, staff_headers, upload_dir
):
    equipment = client.post(
        "/api/v1/equipment/", json=_equipment_payload(), headers=admin_headers
    ).json()

    response = client.post(
        f"/api/v1/equipment/{equipment['id']}/document",
        files={"file": ("warranty.pdf", b"%PDF-1.4 fake", "application/pdf")},
        headers=staff_headers,
    )

    assert response.status_code == 403
