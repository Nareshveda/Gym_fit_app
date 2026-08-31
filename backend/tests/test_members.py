"""Tests for the Member Enrollment module: `enrolled_by` stamping, uniqueness,
search/filter/pagination, soft-delete (deactivate), member codes, and the
field-level validation added after phone numbers >15 characters were found
to be silently accepted (CLAUDE.md: "never skip input validation").
"""

from __future__ import annotations

from tests.conftest import make_member


def _member_payload(**overrides) -> dict:
    payload = {
        "full_name": "Alice Smith",
        "phone": "555-0101",
        "birth_month": 5,
        "birth_year": 1990,
        "gender": "female",
        "training_category": "group_training",
    }
    payload.update(overrides)
    return payload


def test_create_member_stamps_enrolled_by_current_user(
    client, staff_user, staff_headers
):
    response = client.post(
        "/api/v1/members/", json=_member_payload(), headers=staff_headers
    )
    assert response.status_code == 201
    body = response.json()
    assert body["enrolled_by"] == staff_user.id
    assert body["status"] == "active"


def test_create_member_requires_authentication(client):
    response = client.post("/api/v1/members/", json=_member_payload())
    assert response.status_code == 401


def test_create_member_duplicate_email_returns_409(client, staff_headers):
    payload = _member_payload(email="member@example.com")
    first = client.post("/api/v1/members/", json=payload, headers=staff_headers)
    assert first.status_code == 201

    second = client.post(
        "/api/v1/members/",
        json=_member_payload(email="member@example.com", full_name="Other"),
        headers=staff_headers,
    )
    assert second.status_code == 409


def test_list_members_search_and_filter(client, db_session, staff_user, staff_headers):
    make_member(
        db_session, enrolled_by=staff_user.id, full_name="Bob Jones", phone="555-0200"
    )
    make_member(
        db_session, enrolled_by=staff_user.id, full_name="Carol White", phone="555-0300"
    )

    response = client.get(
        "/api/v1/members/", params={"search": "Bob"}, headers=staff_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["full_name"] == "Bob Jones"


def test_deactivate_member_is_soft_delete(
    client, db_session, staff_user, staff_headers
):
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


def test_create_member_requires_training_category(client, staff_headers):
    payload = _member_payload()
    del payload["training_category"]
    response = client.post("/api/v1/members/", json=payload, headers=staff_headers)
    assert response.status_code == 422


def test_create_member_rejects_invalid_training_category(client, staff_headers):
    response = client.post(
        "/api/v1/members/",
        json=_member_payload(training_category="yoga"),
        headers=staff_headers,
    )
    assert response.status_code == 422


def test_create_member_accepts_personal_training_category(client, staff_headers):
    response = client.post(
        "/api/v1/members/",
        json=_member_payload(training_category="personal_training"),
        headers=staff_headers,
    )
    assert response.status_code == 201
    assert response.json()["training_category"] == "personal_training"


def test_list_members_filters_by_training_category(
    client, db_session, staff_user, staff_headers
):
    from tests.conftest import TrainingCategory

    make_member(
        db_session,
        enrolled_by=staff_user.id,
        full_name="Personal Pat",
        phone="555-0400",
        training_category=TrainingCategory.PERSONAL_TRAINING,
    )
    make_member(
        db_session,
        enrolled_by=staff_user.id,
        full_name="Group Gary",
        phone="555-0500",
        training_category=TrainingCategory.GROUP_TRAINING,
    )

    response = client.get(
        "/api/v1/members/",
        params={"training_category": "personal_training"},
        headers=staff_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["full_name"] == "Personal Pat"


def test_member_response_includes_computed_age(client, staff_headers):
    response = client.post(
        "/api/v1/members/",
        json=_member_payload(birth_month=5, birth_year=1990),
        headers=staff_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["birth_month"] == 5
    assert body["birth_year"] == 1990
    assert isinstance(body["age"], int)
    assert body["age"] >= 30


# --- Member code generation -------------------------------------------------


def test_member_code_is_prefixed_by_category_and_sequential(client, staff_headers):
    first = client.post(
        "/api/v1/members/",
        json=_member_payload(phone="555-1001", training_category="personal_training"),
        headers=staff_headers,
    ).json()
    second = client.post(
        "/api/v1/members/",
        json=_member_payload(phone="555-1002", training_category="personal_training"),
        headers=staff_headers,
    ).json()
    group = client.post(
        "/api/v1/members/",
        json=_member_payload(phone="555-1003", training_category="group_training"),
        headers=staff_headers,
    ).json()

    assert first["member_code"].startswith("PT-")
    assert second["member_code"].startswith("PT-")
    assert first["member_code"] != second["member_code"]
    assert group["member_code"].startswith("GT-")


def test_member_search_matches_member_code(
    client, db_session, staff_user, staff_headers
):
    member = make_member(
        db_session, enrolled_by=staff_user.id, member_code="PT-0099", phone="555-9999"
    )

    response = client.get(
        "/api/v1/members/", params={"search": "PT-0099"}, headers=staff_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == member.id


# --- Field validation --------------------------------------------------------


def test_create_member_rejects_phone_over_15_digits(client, staff_headers):
    response = client.post(
        "/api/v1/members/",
        json=_member_payload(phone="1234567890123456"),
        headers=staff_headers,
    )
    assert response.status_code == 422


def test_create_member_rejects_phone_with_letters(client, staff_headers):
    response = client.post(
        "/api/v1/members/",
        json=_member_payload(phone="98765ABCDE"),
        headers=staff_headers,
    )
    assert response.status_code == 422


def test_create_member_rejects_phone_too_short(client, staff_headers):
    response = client.post(
        "/api/v1/members/", json=_member_payload(phone="12345"), headers=staff_headers
    )
    assert response.status_code == 422


def test_create_member_accepts_valid_phone_formats(client, staff_headers):
    for index, phone in enumerate(["9876543210", "+91 98765 43210", "987-654-3210"]):
        response = client.post(
            "/api/v1/members/",
            json=_member_payload(phone=phone, email=f"valid{index}@example.com"),
            headers=staff_headers,
        )
        assert response.status_code == 201, response.text


def test_create_member_rejects_whatsapp_over_15_digits(client, staff_headers):
    response = client.post(
        "/api/v1/members/",
        json=_member_payload(whatsapp_number="1234567890123456"),
        headers=staff_headers,
    )
    assert response.status_code == 422


def test_create_member_rejects_emergency_contact_phone_invalid(client, staff_headers):
    response = client.post(
        "/api/v1/members/",
        json=_member_payload(emergency_contact_phone="not-a-phone-number-at-all"),
        headers=staff_headers,
    )
    assert response.status_code == 422


def test_create_member_rejects_full_name_with_digits(client, staff_headers):
    response = client.post(
        "/api/v1/members/",
        json=_member_payload(full_name="Alice123"),
        headers=staff_headers,
    )
    assert response.status_code == 422


def test_create_member_rejects_full_name_with_symbols(client, staff_headers):
    response = client.post(
        "/api/v1/members/",
        json=_member_payload(full_name="<script>alert(1)</script>"),
        headers=staff_headers,
    )
    assert response.status_code == 422


def test_create_member_accepts_hyphenated_and_apostrophe_names(client, staff_headers):
    response = client.post(
        "/api/v1/members/",
        json=_member_payload(full_name="Mary-Jane O'Neil"),
        headers=staff_headers,
    )
    assert response.status_code == 201


def test_create_member_rejects_invalid_gender(client, staff_headers):
    response = client.post(
        "/api/v1/members/", json=_member_payload(gender="robot"), headers=staff_headers
    )
    assert response.status_code == 422


def test_create_member_rejects_birth_month_out_of_range(client, staff_headers):
    for month in (0, 13):
        response = client.post(
            "/api/v1/members/",
            json=_member_payload(birth_month=month),
            headers=staff_headers,
        )
        assert response.status_code == 422


def test_create_member_rejects_birth_year_out_of_range(client, staff_headers):
    from datetime import date

    for year in (1899, date.today().year + 1):
        response = client.post(
            "/api/v1/members/",
            json=_member_payload(birth_year=year),
            headers=staff_headers,
        )
        assert response.status_code == 422


# --- Locations (branches) and referrals -------------------------------------


def test_create_member_with_location_and_referral_fields(
    client, admin_headers, staff_headers
):
    location = client.post(
        "/api/v1/locations/", json={"name": "Downtown Branch"}, headers=admin_headers
    ).json()
    referrer = client.post(
        "/api/v1/members/",
        json=_member_payload(phone="555-2000"),
        headers=staff_headers,
    ).json()

    response = client.post(
        "/api/v1/members/",
        json=_member_payload(
            phone="555-2001",
            location_id=location["id"],
            referred_by_name="Jordan Lee",
            referred_by_member_id=referrer["id"],
        ),
        headers=staff_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["location_id"] == location["id"]
    assert body["referred_by_name"] == "Jordan Lee"
    assert body["referred_by_member_id"] == referrer["id"]


def test_create_member_without_location_or_referral_is_optional(client, staff_headers):
    response = client.post(
        "/api/v1/members/", json=_member_payload(), headers=staff_headers
    )
    assert response.status_code == 201
    body = response.json()
    assert body["location_id"] is None
    assert body["referred_by_name"] is None


def test_list_members_filters_by_location(
    client, db_session, staff_user, staff_headers, admin_headers
):
    location = client.post(
        "/api/v1/locations/", json={"name": "Uptown"}, headers=admin_headers
    ).json()
    make_member(
        db_session,
        enrolled_by=staff_user.id,
        full_name="In Location",
        phone="555-3000",
        location_id=location["id"],
    )
    make_member(
        db_session, enrolled_by=staff_user.id, full_name="No Location", phone="555-3001"
    )

    response = client.get(
        "/api/v1/members/",
        params={"location_id": location["id"]},
        headers=staff_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["full_name"] == "In Location"
