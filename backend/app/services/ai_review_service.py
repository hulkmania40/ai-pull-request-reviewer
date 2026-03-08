import json
import os
from functools import lru_cache

from openai import OpenAI
from dotenv import load_dotenv

from app.models.review_models import FileReviewResult, PRDetailsCleanedResponse, ReviewComment

load_dotenv()

MAX_FILES_REVIEW = int(os.getenv("MAX_FILES_REVIEW", "10"))
MAX_DIFF_CHARS = int(os.getenv("MAX_DIFF_CHARS", "6000"))
GROQ_TIMEOUT_SECONDS = float(os.getenv("GROQ_TIMEOUT_SECONDS", "20"))
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")


@lru_cache(maxsize=1)
def _get_groq_client() -> OpenAI:
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not set")
    return OpenAI(
        api_key=groq_api_key,
        base_url=GROQ_BASE_URL,
        timeout=GROQ_TIMEOUT_SECONDS,
    )


def _truncate_diff(diff: str) -> str:
    if len(diff) <= MAX_DIFF_CHARS:
        return diff

    return (
        f"{diff[:MAX_DIFF_CHARS]}\n\n"
        f"[TRUNCATED: diff exceeded {MAX_DIFF_CHARS} characters]"
    )


def _to_review_comment(item: dict) -> ReviewComment:
    line_value = item.get("line")
    if isinstance(line_value, str) and line_value.isdigit():
        line_value = int(line_value)
    if not isinstance(line_value, int):
        line_value = None

    severity = str(item.get("severity", "warning"))
    comment = str(item.get("comment", "No comment provided by reviewer."))

    return ReviewComment(line=line_value, severity=severity, comment=comment)


def review_diff(filename: str, diff: str) -> list[ReviewComment]:
    if not diff.strip():
        return [
            ReviewComment(
                line=None,
                severity="info",
                comment="No meaningful added or removed lines found for this file.",
            )
        ]

    client = _get_groq_client()

    trimmed_diff = _truncate_diff(diff)

    prompt = f"""You are a senior software engineer reviewing a pull request.

Review the following code diff for file: {filename}

Focus on:
- bugs
- security issues
- performance
- readability

Return JSON only in this shape:
{{
  \"comments\": [
    {{
      \"line\": 12,
      \"severity\": \"warning\",
      \"comment\": \"Possible security issue\"
    }}
  ]
}}

If no issues are found, return an empty comments array.

Diff:
{trimmed_diff}
"""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            temperature=0,
            max_tokens=500,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a strict JSON API. Return JSON only."},
                {"role": "user", "content": prompt},
            ],
        )
        content = response.choices[0].message.content or "{}"
        parsed = json.loads(content)
    except Exception as exc:
        raise RuntimeError("Failed to review file diff with LLM") from exc

    raw_comments = parsed.get("comments", [])
    if not isinstance(raw_comments, list):
        raw_comments = []

    return [_to_review_comment(item) for item in raw_comments if isinstance(item, dict)]


def review_files_individually(pr_files: list[PRDetailsCleanedResponse]) -> list[FileReviewResult]:
    results: list[FileReviewResult] = []

    for file in pr_files[:MAX_FILES_REVIEW]:
        comments = review_diff(file.filename, file.cleaned_patch)
        results.append(FileReviewResult(file=file.filename, comments=comments))

    if len(pr_files) > MAX_FILES_REVIEW:
        skipped = len(pr_files) - MAX_FILES_REVIEW
        results.append(
            FileReviewResult(
                file="__summary__",
                comments=[
                    ReviewComment(
                        line=None,
                        severity="info",
                        comment=(
                            f"Skipped {skipped} files to keep review latency bounded. "
                            "Increase MAX_FILES_REVIEW to review more files."
                        ),
                    )
                ],
            )
        )

    return results
