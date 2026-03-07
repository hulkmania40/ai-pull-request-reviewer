from urllib.parse import urlparse

from fastapi import APIRouter

from app.models.review_models import ReviewRequest, ReviewResponse
from app.services.ai_review_service import get_reviews, create_review

router = APIRouter(prefix="/reviews", tags=["reviews"])


# @router.get("/", response_model=list[ReviewResponse])
# def list_reviews():
#     return get_reviews()

@router.post("/parse-pr", response_model=ReviewResponse)
def parse_pr(request: ReviewRequest):
    print(f"Received URL: {request.url}")

    parsed = urlparse(request.url)
    parts = parsed.path.strip("/").split("/")

    if len(parts) < 4 or parts[2] != "pull":
        raise ValueError("Invalid GitHub Pull Request URL")

    owner = parts[0]
    repo = parts[1]
    pull_number = parts[3]

    return {
        "owner": owner,
        "repo": repo,
        "pull_number": pull_number
    }
    

# @router.post("/", response_model=ReviewResponse)
# def submit_review(request: ReviewRequest):
#     return create_review(request)
