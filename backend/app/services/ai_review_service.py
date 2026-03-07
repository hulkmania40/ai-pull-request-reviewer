from app.models.review_models import ReviewRequest, ReviewResponse


def get_reviews() -> list[ReviewResponse]:
    return [
        ReviewResponse(
            repo_url="https://github.com/example/repo",
            pr_number=1,
            summary="Looks good to me!",
        )
    ]


def create_review(request: ReviewRequest) -> ReviewResponse:
    return ReviewResponse(
        repo_url=request.repo_url,
        pr_number=request.pr_number,
        summary=f"Dummy review for PR #{request.pr_number} in {request.repo_url}",
    )
