from fastapi import APIRouter, HTTPException

from app.models.review_models import FileReviewResult, PRDetailsCleanedResponse, PRDetailsResponse, ReviewRequest, ReviewResponse
from app.services.ai_review_service import review_files_individually
from app.services.github_service import extract_relevant_diffs, fetch_pr_details, parse_pr_url

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/fetch-pr-details", response_model=list[PRDetailsCleanedResponse])
def get_pr_details(request: ReviewResponse):
    try:
        processed_pr_details = fetch_pr_details(request)
        extracted_relevant_diff = extract_relevant_diffs(processed_pr_details)
        return extracted_relevant_diff
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/file-based-review", response_model=list[FileReviewResult])
def file_based_review(request: ReviewResponse):
    try:
        files = fetch_pr_details(request)
        cleaned_files = extract_relevant_diffs(files)
        return review_files_individually(cleaned_files)
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
