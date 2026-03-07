import os
from urllib.parse import urlparse

import httpx
from dotenv import load_dotenv

from app.models.review_models import PRDetailsResponse, ReviewResponse

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
