from fastapi import APIRouter, HTTPException

from app.models.review_models import FileReviewResult, ParsePRValidationResponse, ReviewRequest, ReviewResponse
from app.services.ai_review_service import review_files_individually
from app.services.github_service import extract_relevant_diffs, fetch_pr_details, is_valid_pull_request, parse_pr_url

router = APIRouter(prefix="/reviews", tags=["reviews"])

# Checks the validity of the PR URL and whether the PR exists on GitHub
@router.post("/parse-pr", response_model=ParsePRValidationResponse)
def parse_pr(request: ReviewRequest):
    try:
        parsed = parse_pr_url(request.url)
        is_valid = is_valid_pull_request(parsed)

        if is_valid:
            return ParsePRValidationResponse(
                owner=parsed.owner,
                repo=parsed.repo,
                pull_number=parsed.pull_number,
                is_valid_pr=True,
                message="PR URL parsed successfully and pull request exists on GitHub.",
            )

        return ParsePRValidationResponse(
            owner=parsed.owner,
            repo=parsed.repo,
            pull_number=parsed.pull_number,
            is_valid_pr=False,
            message="PR URL parsed successfully but pull request was not found on GitHub.",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

@router.post("/run", response_model=list[FileReviewResult])
def run_review(request: ReviewResponse):
    try:
        files = fetch_pr_details(request)
        cleaned_files = extract_relevant_diffs(files)
        return review_files_individually(cleaned_files)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc