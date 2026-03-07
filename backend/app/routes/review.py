from fastapi import APIRouter, HTTPException

from app.models.review_models import PRDetailsResponse, ReviewRequest, ReviewResponse
from app.services.github_service import fetch_pr_details, parse_pr_url

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/fetch-pr-details", response_model=list[PRDetailsResponse])
def get_pr_details(request: ReviewResponse):
    try:
        return fetch_pr_details(request)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

@router.post("/parse-pr", response_model=ReviewResponse)
def parse_pr(request: ReviewRequest):
    try:
        return parse_pr_url(request.url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    

# @router.post("/", response_model=ReviewResponse)
# def submit_review(request: ReviewRequest):
#     return create_review(request)
