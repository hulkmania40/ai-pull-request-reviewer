from pydantic import BaseModel
from typing import Optional

class ReviewRequest(BaseModel):
    url: str


class ReviewResponse(BaseModel):
    owner: str
    repo: str
    pull_number: str

class PRDetailsResponse(BaseModel):
    sha: str
    filename: str
    status: str
    additions: int
    deletions: int
    changes: int
    blob_url: str
    raw_url: str
    contents_url: str
    patch: Optional[str] = None

class PRDetailsCleanedResponse(BaseModel):
    sha: str
    filename: str
    status: str
    additions: int
    deletions: int
    changes: int
    cleaned_patch: str