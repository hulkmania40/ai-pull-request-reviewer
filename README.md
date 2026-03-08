# AI Pull Request Reviewer

An AI-powered tool that reviews GitHub Pull Requests and generates automated code review feedback using Large Language Models (LLMs).

The application fetches the code diff from a pull request, analyzes it using an LLM, and returns structured comments highlighting potential bugs, security issues, performance problems, and code quality improvements.

---

## Features

* Analyze GitHub Pull Requests automatically
* AI-generated code review suggestions
* Detect potential bugs and security issues
* Suggest improvements for readability and maintainability
* Structured review comments grouped by file
* Built with a modern full-stack architecture

---

## Tech Stack

### Backend

* FastAPI
* Python
* httpx
* Pydantic
* LLM API (Groq)

### Frontend

* React
* TypeScript
* Vite
* TailwindCSS

### APIs

* GitHub REST API

---

## Architecture

```
User
 │
 ▼
Frontend (React)
 │
 ▼
FastAPI Backend
 │
 ├── GitHub API (fetch PR diffs)
 │
 └── LLM Service (AI code review)
```

Pipeline:

```
PR URL
  ↓
Fetch PR files from GitHub
  ↓
Extract code diffs
  ↓
Send diff to LLM
  ↓
Generate structured review comments
  ↓
Return review results
```

---

## Example Usage

Input:

```
https://github.com/paperclipai/paperclip/pull/195

```

Output:

```
File: auth.py

⚠ Warning
Line 23: Password comparison should use constant time comparison to avoid timing attacks.

💡 Suggestion
Line 45: Consider using dependency injection for improved testability.
```

---

## API Endpoint

### Review Pull Request

```
POST /review-pr

```

Request body:

```json
{
  "pr_url": "https://github.com/user/repo/pull/42"
}
```

Response:

```json
{
  "comments": [
    {
      "file": "auth.py",
      "line": 23,
      "severity": "warning",
      "comment": "Password comparison should use constant time comparison."
    }
  ]
}
```

---

## Running Locally

### Clone the repository

```
git clone https://github.com/yourusername/ai-pr-reviewer.git
cd ai-pr-reviewer
```

### Backend Setup

```
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend will run at:

```
http://localhost:8000

```

### Frontend Setup

```
cd frontend
bun install
bun run dev
```

Frontend will run at:

```
http://localhost:5173

```

---

## Future Improvements

* Inline diff viewer for PR files
* GitHub OAuth integration
* Post AI review comments directly on PR
* Support for large PRs with diff chunking
* Caching for repeated reviews
* Multi-model support for different LLM providers

---

## Why This Project

Code reviews are essential but time-consuming. This tool demonstrates how LLMs can assist developers by automatically analyzing pull request diffs and generating actionable feedback to improve code quality and development speed.

---

## License

MIT License
