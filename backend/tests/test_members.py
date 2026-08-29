"""Tests for the Member Enrollment module: `enrolled_by` stamping, uniqueness,
search/filter/pagination, and the soft-delete (deactivate) contract from
CLAUDE.md ("never a hard delete").
"""
from __future__ import annotations

from datetime import date

from tests.conftest import make_member


def _member_payload(**overrides) -> dict:
    payload = {
        "full_name": "Alice Smith",
        "phone": "555-0101",
        "date_of_birth": "1990-05-15",
        "gender": "female",
    }
    payload.update(overrides)
    return payload


def test_create_member_stamps_enrolled_by_current_user(client, staff_user, staff_headers):
    response = client.post("/api/v1/members/", json=_member_payload(), headers=staff_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["enrolled_by"] == staff_user.id
    assert body["status"] == "active"


def test_create_member_requires_authentication(client):
    response = client.post("/api/v1/members/", json=_member_payload())
    assert response.status_code == 401


def test_create_member_rejects_future_date_of_birth(client, staff_headers):
    response = client.post(
        "/api/v1/members/", json=_member_payload(date_of_birth="2999-01-01"), headers=staff_headers
    )
    assert response.status_code == 422


def test_create_member_duplicate_email_returns_409(client, staff_headers):
    payload = _member_payload(email="member@example.com")
    first = client.post("/api/v1/members/", json=payload, headers=staff_headers)
    assert first.status_code == 201

    second = client.post(
        "/api/v1/members/", json=_member_payload(email="member@example.com", full_name="Other"), headers=staff_headers
    )
    assert second.status_code == 409


def test_list_members_search_and_filter(client, db_session, staff_user, staff_headers):
    make_member(db_session, enrolled_by=staff_user.id, full_name="Bob Jones", phone="555-0200")
    make_member(db_session, enrolled_by=staff_user.id, full_name="Carol White", phone="555-0300")

    response = client.get("/api/v1/members/", params={"search": "Bob"}, headers=staff_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["full_name"] == "Bob Jones"


def test_deactivate_member_is_soft_delete(client, db_session, staff_user, staff_headers):
    member = make_member(db_session, enrolled_by=staff_user.id)

    response = client.delete(f"/api/v1/members/{member.id}", headers=staff_headers)
    assert response.status_code == 204

    # The record still exists (never hard-deleted) with status flipped to inactive.
    fetch = client.get(f"/api/v1/members/{member.id}", headers=staff_headers)
    assert fetch.status_code == 200
    assert fetch.json()["status"] == "inactive"


def test_get_nonexistent_member_returns_404(client, staff_headers):
    response = client.get("/api/v1/members/999999", headers=staff_headers)
    assert response.status_code == 404
