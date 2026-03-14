from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Literal


class AuthUser(BaseModel):
    id: int

    github_id: Optional[int] = None
    login: Optional[str] = None

    name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None

    password_hash: Optional[str] = None
    auth_provider: Literal["github", "local"]
    email_verified: bool = False

    created_at: datetime
    updated_at: datetime

class userDetailsPayload(BaseModel):
    email: str
    password: str