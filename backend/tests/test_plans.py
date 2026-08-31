"""Tests for membership plan CRUD (create/list/update/deactivate)."""

from __future__ import annotations


def test_create_and_list_plan(client, staff_headers):
    create = client.post(
        "/api/v1/plans/",
        json={"name": "Quarterly Pro", "duration_type": "quarterly", "price": "89.99"},
        headers=staff_headers,
    )
    assert create.status_code == 201
    plan_id = create.json()["id"]

    listing = client.get("/api/v1/plans/", headers=staff_headers)
    assert listing.status_code == 200
    assert any(plan["id"] == plan_id for plan in listing.json())


def test_update_plan_partial(client, staff_headers):
    plan_id = client.post(
        "/api/v1/plans/",
        json={"name": "Yearly", "duration_type": "yearly", "price": "199.99"},
        headers=staff_headers,
    ).json()["id"]

    response = client.put(
        f"/api/v1/plans/{plan_id}", json={"price": "149.99"}, headers=staff_headers
    )
    assert response.status_code == 200
    assert response.json()["price"] == "149.99"
    assert response.json()["name"] == "Yearly"


def test_deactivate_plan_preserves_it_but_hides_from_active_only(client, staff_headers):
    plan_id = client.post(
        "/api/v1/plans/",
        json={"name": "Trial", "duration_type": "monthly", "price": "9.99"},
        headers=staff_headers,
    ).json()["id"]

    deactivate = client.delete(f"/api/v1/plans/{plan_id}", headers=staff_headers)
    assert deactivate.status_code == 200
    assert deactivate.json()["is_active"] is False

    active_only = client.get(
        "/api/v1/plans/", params={"active_only": True}, headers=staff_headers
    )
    assert plan_id not in [p["id"] for p in active_only.json()]

    all_plans = client.get("/api/v1/plans/", headers=staff_headers)
    assert plan_id in [p["id"] for p in all_plans.json()]
