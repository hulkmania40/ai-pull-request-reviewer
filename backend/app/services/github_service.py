import os
from urllib.parse import urlparse

import httpx
from dotenv import load_dotenv

from app.models.review_models import PRDetailsCleanedResponse, PRDetailsResponse, ReviewResponse

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

headers = {
	"Accept": "application/vnd.github+json",
}
if GITHUB_TOKEN:
	headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

client = httpx.Client(headers=headers, timeout=10)


def fetch_pr_details(data: ReviewResponse) -> list[PRDetailsResponse]:
	url = f"https://api.github.com/repos/{data.owner}/{data.repo}/pulls/{data.pull_number}/files"

	try:
		response = client.get(url)
		response.raise_for_status()
	except httpx.HTTPError as exc:
		raise RuntimeError("Failed to fetch PR details from GitHub") from exc

	return [PRDetailsResponse(**item) for item in response.json()]

def extract_relevant_diffs(pr_details: list[PRDetailsResponse]) -> list[PRDetailsCleanedResponse]:
	cleaned_diffs: list[PRDetailsCleanedResponse] = []

	for detail in pr_details:
		cleaned_diffs.append(
			PRDetailsCleanedResponse(
				sha=detail.sha,
				filename=detail.filename,
				status=detail.status,
				additions=detail.additions,
				deletions=detail.deletions,
				changes=detail.changes,
				cleaned_patch=extract_relevant_diff(detail.patch),
			)
		)

	return cleaned_diffs

def extract_relevant_diff(patch: str | None) -> str:
	if not patch:
		return ""

	useful_lines: list[str] = []

	for line in patch.splitlines():
		# Skip hunk metadata lines like: @@ -10,6 +10,7 @@
		if line.startswith("@@"):
			continue
		# Keep only code additions/removals, not file headers.
		if (line.startswith("+") and not line.startswith("+++")) or (
			line.startswith("-") and not line.startswith("---")
		):
			useful_lines.append(line)

	return "\n".join(useful_lines)

def parse_pr_url(url: str) -> ReviewResponse:
	parsed = urlparse(url)
	parts = parsed.path.strip("/").split("/")

	if len(parts) < 4 or parts[2] != "pull":
		raise ValueError("Invalid GitHub Pull Request URL")

	return ReviewResponse(
		owner=parts[0],
		repo=parts[1],
		pull_number=parts[3],
	)
