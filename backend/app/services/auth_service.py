import os
import secrets
import hmac
import hashlib
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv

from app.models.auth_models import AuthUser
from app.services.db_service import get_db_connection

load_dotenv()

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_API_USER_URL = "https://api.github.com/user"
GITHUB_API_EMAILS_URL = "https://api.github.com/user/emails"
SESSION_DAYS = int(os.getenv("AUTH_SESSION_DAYS", "7"))
OAUTH_STATE_TTL_SECONDS = int(os.getenv("OAUTH_STATE_TTL_SECONDS", "600"))


def _get_required_env(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise RuntimeError(f"{key} is not set")
    return value


def _get_oauth_state_secret() -> str:
    return (
        os.getenv("AUTH_STATE_SECRET")
        or os.getenv("GITHUB_CLIENT_SECRET")
        or "local-dev-oauth-state-secret"
    )


def _sign_state_payload(payload: str) -> str:
    return hmac.new(
        _get_oauth_state_secret().encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def create_github_oauth_state() -> str:
    nonce = secrets.token_hex(16)
    issued_at = int(datetime.now(timezone.utc).timestamp())
    payload = f"{nonce}:{issued_at}"
    signature = _sign_state_payload(payload)
    return f"{payload}:{signature}"


def verify_github_oauth_state(state: str) -> bool:
    parts = state.split(":")
    if len(parts) != 3:
        return False

    nonce, issued_at_raw, signature = parts
    if not nonce or not issued_at_raw or not signature:
        return False

    try:
        issued_at = int(issued_at_raw)
    except ValueError:
        return False

    payload = f"{nonce}:{issued_at}"
    expected_signature = _sign_state_payload(payload)
    if not hmac.compare_digest(signature, expected_signature):
        return False

    now = int(datetime.now(timezone.utc).timestamp())
    return now - issued_at <= OAUTH_STATE_TTL_SECONDS


def build_github_oauth_url(state: str) -> str:
    client_id = _get_required_env("GITHUB_CLIENT_ID")
    redirect_uri = _get_required_env("GITHUB_REDIRECT_URI")

    query = urlencode(
        {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": "read:user user:email",
            "state": state,
        }
    )
    return f"{GITHUB_AUTHORIZE_URL}?{query}"


def _fetch_github_access_token(code: str) -> str:
    client_id = _get_required_env("GITHUB_CLIENT_ID")
    client_secret = _get_required_env("GITHUB_CLIENT_SECRET")
    redirect_uri = _get_required_env("GITHUB_REDIRECT_URI")

    response = httpx.post(
        GITHUB_ACCESS_TOKEN_URL,
        headers={"Accept": "application/json"},
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
        },
        timeout=20,
    )
    response.raise_for_status()

    payload = response.json()
    access_token = payload.get("access_token")
    if not access_token:
        raise RuntimeError("GitHub did not return an access token")

    return str(access_token)


def _fetch_github_user(access_token: str) -> dict:
    response = httpx.get(
        GITHUB_API_USER_URL,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {access_token}",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


def _fetch_primary_email(access_token: str) -> str | None:
    response = httpx.get(
        GITHUB_API_EMAILS_URL,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {access_token}",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        timeout=20,
    )

    if response.status_code >= 400:
        return None

    emails = response.json()
    if not isinstance(emails, list):
        return None

    primary_verified = next(
        (
            item
            for item in emails
            if isinstance(item, dict)
            and item.get("primary")
            and item.get("verified")
            and item.get("email")
        ),
        None,
    )
    if primary_verified:
        return str(primary_verified.get("email"))

    any_verified = next(
        (
            item
            for item in emails
            if isinstance(item, dict) and item.get("verified") and item.get("email")
        ),
        None,
    )
    return str(any_verified.get("email")) if any_verified else None


def _ensure_auth_tables() -> None:
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS app_users (
                    id SERIAL PRIMARY KEY,
                    github_id BIGINT UNIQUE NOT NULL,
                    login TEXT UNIQUE NOT NULL,
                    name TEXT,
                    email TEXT,
                    avatar_url TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS app_sessions (
                    token TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    expires_at TIMESTAMPTZ NOT NULL
                );
                """
            )
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_app_sessions_user_id
                ON app_sessions(user_id);
                """
            )
        connection.commit()


def upsert_github_user(github_user: dict, access_token: str) -> AuthUser:
    _ensure_auth_tables()

    github_id = github_user.get("id")
    login = github_user.get("login")
    if not github_id or not login:
        raise RuntimeError("GitHub user payload is missing required fields")

    email = github_user.get("email") or _fetch_primary_email(access_token)

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO app_users (github_id, login, name, email, avatar_url)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (github_id) DO UPDATE
                SET
                    login = EXCLUDED.login,
                    name = EXCLUDED.name,
                    email = EXCLUDED.email,
                    avatar_url = EXCLUDED.avatar_url,
                    updated_at = NOW()
                RETURNING id, github_id, login, name, email, avatar_url, created_at, updated_at;
                """,
                (
                    int(github_id),
                    str(login),
                    github_user.get("name"),
                    email,
                    github_user.get("avatar_url"),
                ),
            )
            row = cursor.fetchone()
        connection.commit()

    if not row:
        raise RuntimeError("Failed to upsert authenticated user")

    return AuthUser(
        id=row[0],
        github_id=row[1],
        login=row[2],
        name=row[3],
        email=row[4],
        avatar_url=row[5],
        created_at=row[6],
        updated_at=row[7],
    )


def create_user_session(user_id: int) -> str:
    _ensure_auth_tables()

    token = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO app_sessions (token, user_id, expires_at)
                VALUES (%s, %s, %s);
                """,
                (token, user_id, expires_at),
            )
        connection.commit()

    return token


def exchange_code_for_user_and_session(code: str) -> tuple[AuthUser, str]:
    access_token = _fetch_github_access_token(code)
    github_user = _fetch_github_user(access_token)
    user = upsert_github_user(github_user, access_token)
    session_token = create_user_session(user.id)
    return user, session_token


def get_user_by_session_token(token: str) -> AuthUser | None:
    _ensure_auth_tables()

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT u.id, u.github_id, u.login, u.name, u.email, u.avatar_url, u.created_at, u.updated_at
                FROM app_sessions s
                JOIN app_users u ON u.id = s.user_id
                WHERE s.token = %s AND s.expires_at > NOW();
                """,
                (token,),
            )
            row = cursor.fetchone()

    if not row:
        return None

    return AuthUser(
        id=row[0],
        github_id=row[1],
        login=row[2],
        name=row[3],
        email=row[4],
        avatar_url=row[5],
        created_at=row[6],
        updated_at=row[7],
    )


def delete_session_token(token: str) -> None:
    _ensure_auth_tables()

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM app_sessions WHERE token = %s;", (token,))
        connection.commit()


def get_frontend_redirect_base_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5173")
