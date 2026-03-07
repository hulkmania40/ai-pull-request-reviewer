from pydantic import BaseModel


class ReviewRequest(BaseModel):
    url: str


class ReviewResponse(BaseModel):
    owner: str
    repo: str
    pull_number: str
