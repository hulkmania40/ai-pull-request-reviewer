from pydantic import BaseModel
from typing import Optional

class ReviewRequest(BaseModel):
    url: str


class ReviewResponse(BaseModel):
    owner: str
    repo: str
    pull_number: str


class ParsePRValidationResponse(BaseModel):
    owner: str
    repo: str
    pull_number: str
    is_valid_pr: bool
    message: str

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


class ReviewComment(BaseModel):
    line: Optional[int] = None
    severity: str
    comment: str


class FileReviewResult(BaseModel):
    file: str
    comments: list[ReviewComment]