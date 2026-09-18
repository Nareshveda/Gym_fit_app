"""Tests for public "Join the Crew" inquiries (leads): submitting is public,
reviewing submitted inquiries is owner/admin only.
"""

from __future__ import annotations

import pytest

VALID_LEAD = {
    "full_name": "Priya Kumar",
    "phone_number": "+91 98765 43210",
    "whatsapp_number": "9876543210",
    "preferred_time": "Weekdays after 6pm",
    "note": "Interested in group training.",
}


def test_anyone_can_submit_a_lead(client):
    response = client.post("/api/v1/leads/", json=VALID_LEAD)
    assert response.status_code == 201
    body = response.json()
    assert body["full_name"] == "Priya Kumar"
    assert body["note"] == "Interested in group training."


def test_submitting_a_lead_requires_no_note(client):
    payload = {**VALID_LEAD, "note": None}
    response = client.post("/api/v1/leads/", json=payload)
    assert response.status_code == 201
    assert response.json()["note"] is None


def test_submitting_a_lead_rejects_invalid_phone(client):
    payload = {**VALID_LEAD, "phone_number": "abc"}
    response = client.post("/api/v1/leads/", json=payload)
    assert response.status_code == 422


def test_submitting_a_lead_rejects_note_over_500_words(client):
    payload = {**VALID_LEAD, "note": " ".join(["word"] * 501)}
    response = client.post("/api/v1/leads/", json=payload)
    assert response.status_code == 422


def test_list_leads_requires_authentication(client):
    response = client.get("/api/v1/leads/")
    assert response.status_code == 401


@pytest.mark.parametrize("headers_fixture", ["staff_headers", "trainer_headers"])
def test_non_admin_roles_cannot_list_leads(client, headers_fixture, request):
    headers = request.getfixturevalue(headers_fixture)
    response = client.get("/api/v1/leads/", headers=headers)
    assert response.status_code == 403


def test_admin_can_list_leads_most_recent_first(client, admin_headers):
    client.post("/api/v1/leads/", json={**VALID_LEAD, "full_name": "First Lead"})
    client.post("/api/v1/leads/", json={**VALID_LEAD, "full_name": "Second Lead"})

    response = client.get("/api/v1/leads/", headers=admin_headers)
    assert response.status_code == 200
    names = [lead["full_name"] for lead in response.json()]
    assert names == ["Second Lead", "First Lead"]
