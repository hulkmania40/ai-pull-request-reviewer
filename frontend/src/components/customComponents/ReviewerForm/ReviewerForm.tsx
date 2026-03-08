import { useState } from "react"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { _post } from "@/lib/apiClient"
import {
  getSeverityClass,
  getSeverityCounts,
  getSeverityIconType,
} from "./ReviewerForm.helpers"

import { toast } from "sonner"

import {
  AlertTriangle,
  Bug,
  Bot,
  Check,
  FileCode2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react"

interface ValidatePRResponse {
  owner: string
  repo: string
  pull_number: string
  is_valid_pr: boolean
  message: string
}

interface ReviewComment {
  line: number
  severity: "warning" | "error" | "info" | string
  comment: string
}

interface FileReview {
  file: string
  comments: ReviewComment[]
}

const ReviewerForm = () => {
  const [inputUrl, setInputUrl] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [validatedPr, setValidatedPr] = useState<ValidatePRResponse | null>(
    null
  )
  const [reviewResults, setReviewResults] = useState<FileReview[] | null>(null)
  const isReviewComplete = reviewResults !== null

  const validatePr = async (url: string) => {
    const res = await _post<ValidatePRResponse, { url: string }>(
      "/reviews/parse-pr",
      { url }
    )

    if (res.ok && res.data.is_valid_pr) {
      setValidatedPr(res.data)
      toast.success("PR validated. You can run review now.")
    } else {
      setValidatedPr(null)
      toast.error(
        "Failed to validate PR: " +
          (res.ok ? "Invalid PR response" : res.error.message)
      )
    }

    setIsValidating(false)
  }

  const reviewPr = async (inputData: ValidatePRResponse) => {
    const payload = {
      owner: inputData.owner,
      repo: inputData.repo,
      pull_number: inputData.pull_number,
    }

    const res = await _post<FileReview[], typeof payload>(
      "/reviews/run",
      payload
    )

    if (res.ok) {
      setReviewResults(res.data)
      toast.success("Review completed")
    } else {
      toast.error("Review failed: " + res.error.message)
    }

    setIsReviewing(false)
  }

  const resetSession = () => {
    setInputUrl("")
    setIsValidating(false)
    setIsReviewing(false)
    setValidatedPr(null)
    setReviewResults(null)
  }

  const allComments = reviewResults?.flatMap((item) => item.comments) ?? []
  const { errorCount, warningCount, bugCount, infoCount } =
    getSeverityCounts(allComments)
  const isStep1Active = !validatedPr
  const isStep2Active = !!validatedPr && !isReviewComplete
  const isStep3Active = isReviewComplete

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-linear-to-br from-background via-background to-emerald-50/30 p-4 shadow-sm sm:p-5 dark:to-emerald-950/20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Pull Request Reviewer
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Validate the PR once, then run AI review. <span className="text-xs">(*Works only on public repos)</span>
            </p>
          </div>

          <Button
            type="button"
            variant={isStep3Active ? "default" : "secondary"}
            onClick={resetSession}
            disabled={isValidating || isReviewing}
            className={`gap-2 ${isReviewComplete ? "ring-2 ring-emerald-300/60 dark:ring-emerald-500/40" : ""}`}
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Field className="w-full min-w-0 md:flex-1">
            <FieldLabel htmlFor="input-field-pr-url">
              Pull Request URL
            </FieldLabel>
            <div className="relative">
              <Input
                id="input-field-pr-url"
                type="text"
                placeholder="https://github.com/user/repo/pull/1"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                disabled={isValidating || isReviewing || !!validatedPr}
                className="pr-10"
              />
              {validatedPr?.is_valid_pr && (
                <Check className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-emerald-600" />
              )}
            </div>
            <FieldDescription>
              Paste a GitHub PR URL to start analysis.
            </FieldDescription>
          </Field>

          <Button
            type="button"
            variant={isStep1Active ? "default" : "secondary"}
            className={`w-full md:mt-6 md:w-auto md:self-start ${!validatedPr ? "ring-2 ring-emerald-300/60 dark:ring-emerald-500/40" : ""}`}
            onClick={() => {
              setIsValidating(true)
              setReviewResults(null)
              validatePr(inputUrl)
            }}
            disabled={
              isValidating || isReviewing || !inputUrl.trim() || !!validatedPr
            }
          >
            {isValidating ? (
              <span className="flex items-center gap-2">
                Validating
                <Spinner />
              </span>
            ) : (
              "Validate"
            )}
          </Button>

          <Button
            type="button"
            variant={isStep2Active ? "default" : "secondary"}
            className={`w-full md:mt-6 md:w-auto md:self-start ${validatedPr?.is_valid_pr && !isReviewComplete ? "ring-2 ring-emerald-300/60 dark:ring-emerald-500/40" : ""}`}
            onClick={() => {
              if (!validatedPr) {
                return
              }
              setIsReviewing(true)
              reviewPr(validatedPr)
            }}
            disabled={
              isReviewing ||
              isValidating ||
              !validatedPr?.is_valid_pr ||
              isReviewComplete
            }
          >
            {isReviewing ? (
              <span className="flex items-center gap-2">
                Reviewing
                <Spinner />
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Bot />
                AI Review
              </span>
            )}
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full border px-3 py-1 ${validatedPr?.is_valid_pr ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-border bg-background text-muted-foreground"}`}
          >
            Step 1: Validate URL
          </span>
          <span
            className={`rounded-full border px-3 py-1 ${validatedPr?.is_valid_pr ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-border bg-background text-muted-foreground"}`}
          >
            {validatedPr?.is_valid_pr ? "Validated" : "Waiting"}
          </span>
          <span
            className={`rounded-full border px-3 py-1 ${isReviewComplete ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300" : isReviewing ? "border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300" : "border-border bg-background text-muted-foreground"}`}
          >
            {isReviewComplete
              ? "Step 2: Review completed"
              : isReviewing
                ? "Review in progress"
                : "Step 2: Run AI Review"}
          </span>
          <span
            className={`rounded-full border px-3 py-1 ${isReviewComplete ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-border bg-background text-muted-foreground"}`}
          >
            Step 3: Reset for new PR
          </span>
        </div>

        {isReviewComplete && (
          <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            Review complete. Click the highlighted "Reset" button to start a new
            PR review.
          </p>
        )}
      </section>

      {reviewResults && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <FileCode2 className="h-5 w-5 text-foreground/80" />
              Review Results
            </h3>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-red-200 bg-red-100 px-3 py-1 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                Errors: {errorCount}
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                Warnings: {warningCount}
              </span>
              <span className="rounded-full border border-fuchsia-200 bg-fuchsia-100 px-3 py-1 text-fuchsia-700 dark:border-fuchsia-900/50 dark:bg-fuchsia-950/40 dark:text-fuchsia-300">
                Bugs: {bugCount}
              </span>
              <span className="rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                Info: {infoCount}
              </span>
              <span className="rounded-full border border-border bg-muted px-3 py-1 text-foreground/80">
                Files: {reviewResults.length}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {reviewResults.map((fileResult) => (
              <article
                key={fileResult.file}
                className="rounded-xl border border-border bg-muted/40 p-4"
              >
                <h4 className="text-sm font-semibold break-all text-foreground">
                  {fileResult.file}
                </h4>

                {fileResult.comments.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No issues reported for this file.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {fileResult.comments.map((item, idx) => {
                      const severityIconType = getSeverityIconType(item.severity)

                      return (
                        <div
                          key={`${fileResult.file}-${idx}`}
                          className="rounded-lg border border-border bg-card p-3"
                        >
                          <div className="mb-2 flex items-center gap-2 text-xs font-medium">
                            <span
                              className={`rounded border px-2 py-0.5 ${getSeverityClass(item.severity)}`}
                            >
                              {item.severity.toUpperCase()}
                            </span>
                            <span className="text-muted-foreground">
                              Line: {item.line}
                            </span>
                            {severityIconType === "error" && (
                              <XCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                            )}
                            {severityIconType === "warning" && (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                            )}
                            {severityIconType === "bug" && (
                              <Bug className="h-3.5 w-3.5 text-fuchsia-500 dark:text-fuchsia-400" />
                            )}
                          </div>
                          <p className="text-sm text-foreground/90">
                            {item.comment}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default ReviewerForm
