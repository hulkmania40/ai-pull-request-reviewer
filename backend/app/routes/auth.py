from fastapi import APIRouter, Cookie, Header, HTTPException, Query, Response
from fastapi.responses import RedirectResponse

from app.services.auth_service import (
    build_github_oauth_url,
    create_github_oauth_state,
    delete_session_token,
    exchange_code_for_user_and_session,
    get_frontend_redirect_base_url,
    get_user_by_session_token,
    verify_github_oauth_state,
)

router = APIRouter(prefix="/auth", tags=["auth"])


COOKIE_STATE_KEY = "github_oauth_state"


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid bearer token")

    return token


@router.get("/github/login")
def github_login():
    try:
        state = create_github_oauth_state()
        auth_url = build_github_oauth_url(state)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    response = RedirectResponse(url=auth_url)
    response.set_cookie(
        key=COOKIE_STATE_KEY,
        value=state,
        httponly=True,
        samesite="lax",
        max_age=600,
    )
    return response


@router.get("/github/callback")
def github_callback(
    code: str = Query(...),
    state: str = Query(...),
    github_oauth_state: str | None = Cookie(default=None, alias=COOKIE_STATE_KEY),
):
    if not verify_github_oauth_state(state):
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    # Keep cookie check as a defense-in-depth mechanism when callback host matches.
    if github_oauth_state and github_oauth_state != state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    try:
        _, session_token = exchange_code_for_user_and_session(code)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"GitHub OAuth failed: {str(exc)}") from exc

    frontend_url = get_frontend_redirect_base_url().rstrip("/")
    redirect_url = f"{frontend_url}/#auth_token={session_token}"
    response = RedirectResponse(url=redirect_url)
    response.delete_cookie(COOKIE_STATE_KEY)
    return response


@router.get("/me")
def auth_me(authorization: str | None = Header(default=None)):
    token = _extract_bearer_token(authorization)
    user = get_user_by_session_token(token)

    if not user:
        raise HTTPException(status_code=401, detail="Session is invalid or expired")

    return user


@router.post("/logout")
def auth_logout(authorization: str | None = Header(default=None)):
    token = _extract_bearer_token(authorization)
    delete_session_token(token)
    return Response(status_code=204)
