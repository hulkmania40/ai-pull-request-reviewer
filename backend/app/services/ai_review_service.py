from app.models.review_models import FileReviewResult, PRDetailsCleanedResponse


def ai_review_file_diff(filename: str, patch: str) -> list[str]:
    """Return lightweight review comments for a single file diff."""
    if not patch.strip():
        return ["No meaningful added or removed lines found for this file."]

    comments: list[str] = []

    if "print(" in patch:
        comments.append("Consider removing or guarding debug print statements.")
    if "TODO" in patch or "FIXME" in patch:
        comments.append("Resolve TODO/FIXME notes before merging.")
    if "except Exception" in patch:
        comments.append("Avoid broad exception handling unless it is intentional and logged.")
    if filename.endswith(".py") and "requests." in patch:
        comments.append("Use a timeout and error handling for outbound HTTP calls.")

    if not comments:
        comments.append("No high-risk issues detected from the changed lines.")

    return comments


def review_files_individually(pr_files: list[PRDetailsCleanedResponse]) -> list[FileReviewResult]:
    results: list[FileReviewResult] = []

    for file in pr_files:
        comments = ai_review_file_diff(file.filename, file.cleaned_patch)
        results.append(FileReviewResult(file=file.filename, comments=comments))

    return results
