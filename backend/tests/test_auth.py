"""Tests for registration, login, and profile endpoints (Auth module)."""
from __future__ import annotations


def test_register_creates_user_and_returns_tokens(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new.staff@example.com",
            "password": "StrongPass1!",
            "full_name": "New Staff",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["user"]["email"] == "new.staff@example.com"
    assert body["user"]["role"] == "staff"


def test_register_duplicate_email_returns_409(client):
    payload = {
        "email": "dupe@example.com",
        "password": "StrongPass1!",
        "full_name": "First",
    }
    first = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/api/v1/auth/register", json={**payload, "full_name": "Second"})
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "CONFLICT"


def test_login_with_correct_credentials_succeeds(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "password": "StrongPass1!", "full_name": "Login User"},
    )
    response = client.post(
        "/api/v1/auth/login", json={"email": "login@example.com", "password": "StrongPass1!"}
    )
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_with_wrong_password_returns_401(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "wrongpw@example.com", "password": "StrongPass1!", "full_name": "User"},
    )
    response = client.post(
        "/api/v1/auth/login", json={"email": "wrongpw@example.com", "password": "WrongPass1!"}
    )
    assert response.status_code == 401


def test_get_me_requires_authentication(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_get_me_returns_current_user(client, staff_user, staff_headers):
    response = client.get("/api/v1/auth/me", headers=staff_headers)
    assert response.status_code == 200
    assert response.json()["email"] == staff_user.email


def test_refresh_rotates_tokens(client):
    register = client.post(
        "/api/v1/auth/register",
        json={"email": "refresh@example.com", "password": "StrongPass1!", "full_name": "Refresh User"},
    ).json()

    response = client.post("/api/v1/auth/refresh", json={"refresh_token": register["refresh_token"]})
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"] != register["access_token"]
    assert body["refresh_token"] != register["refresh_token"]

    # The rotated-out token can no longer be used.
    reuse = client.post("/api/v1/auth/refresh", json={"refresh_token": register["refresh_token"]})
    assert reuse.status_code == 401


def test_logout_revokes_refresh_token(client):
    register = client.post(
        "/api/v1/auth/register",
        json={"email": "logout@example.com", "password": "StrongPass1!", "full_name": "Logout User"},
    ).json()

    logout = client.post("/api/v1/auth/logout", json={"refresh_token": register["refresh_token"]})
    assert logout.status_code == 204

    reuse = client.post("/api/v1/auth/refresh", json={"refresh_token": register["refresh_token"]})
    assert reuse.status_code == 401


def test_update_me_changes_full_name(client, staff_headers):
    response = client.put("/api/v1/auth/me", json={"full_name": "Updated Name"}, headers=staff_headers)
    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated Name"
