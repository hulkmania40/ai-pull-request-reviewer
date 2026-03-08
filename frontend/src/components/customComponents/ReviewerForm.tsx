import { useState } from "react"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { _post } from "@/lib/apiClient"

import { toast } from "sonner"

import { Check } from "lucide-react"

interface validatePRResponse {
    owner: string,
    repo: string,
    pull_number: string,
    is_valid_pr: boolean,
    message: string
    detail?: string
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
    const [validationResult, setValidationResult] = useState<validatePRResponse | null>(null)
    const [reviewResults, setReviewResults] = useState<FileReview[] | null>(null)

    const validatePr = async (url: string) => {
        const payload = {
            "url": url
        }
        const res = await _post<validatePRResponse, { url: string }>("/reviews/parse-pr", payload)

        if (res.ok) {
            if (res.data.is_valid_pr) {
                console.log(res.data)
                setValidationResult(res.data)
                toast.success(res.data.message)
            } else {
                toast.error("Failed to validate PR")
            }
        } else {
            toast.error("Failed to validate PR: " + res.error.message)
        }

        setIsValidating(false)
    }

    const reviewPr = async (inputData: validatePRResponse) => {
        const payload = {
            owner: inputData.owner,
            repo: inputData.repo,
            pull_number: inputData.pull_number,
        }

        const res = await _post<FileReview[], typeof payload>("/reviews/run", payload)

        if (res.ok) {
            setReviewResults(res.data)
            toast.success("Review completed")
        } else {
            toast.error("Review failed: " + res.error.message)
        }

        setIsReviewing(false)
    }

    const getSeverityClass = (severity: string) => {
        if (severity === "error") {
            return "bg-red-100 text-red-700 border-red-200"
        }

        if (severity === "warning") {
            return "bg-amber-100 text-amber-700 border-amber-200"
        }

        return "bg-blue-100 text-blue-700 border-blue-200"
    }

    return (
        <div>
            <div className="flex items-center gap-2">
                <Field>
                    <FieldLabel htmlFor="input-field-pr-url">Enter the PR URL</FieldLabel>
                    <div className="relative">
                        <Input
                            id="input-field-pr-url"
                            type="text"
                            placeholder="https://github.com/user/repo/pull/1"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            disabled={isValidating || validationResult !== null}
                        />
                        {validationResult !== null && (
                            validationResult.is_valid_pr && (
                                <Check className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />
                            )
                        )}
                    </div>
                    <FieldDescription>
                        Enter the URL of the pull request you want to review. The AI will analyze the changes and provide feedback.
                    </FieldDescription>
                </Field>
                <Button
                    variant="default"
                    onClick={() => {
                        setIsValidating(true)
                        validatePr(inputUrl)
                    }}
                    disabled={isValidating || validationResult !== null}
                >
                    {
                        isValidating ?
                            <span className="flex gap-1 items-center">
                                Validating...
                                <Spinner />
                            </span>
                            :
                            "Validate"
                    }
                </Button>
            </div>
            {validationResult && (
                <div className="mt-4 p-4 bg-green-100 text-green-800">
                    <h3 className="font-bold">Validation Result:</h3>
                    <p>Owner: {validationResult.owner}</p>
                    <p>Repo: {validationResult.repo}</p>
                    <p>Pull Number: {validationResult.pull_number}</p>
                    <p>Is Valid PR: {validationResult.is_valid_pr.toString()}</p>
                    <p>Message: {validationResult.message}</p>
                </div>
            )}
            <div className="flex items-center gap-2">
                <Field>
                    <FieldLabel htmlFor="run-ai-review">Run AI Review</FieldLabel>
                    <div className="relative">
                        <Button
                            id="run-ai-review"
                            variant="default"
                            onClick={() => {
                                setIsReviewing(true)
                                validationResult && reviewPr(validationResult)
                            }}
                            disabled={isReviewing || !validationResult || !validationResult.is_valid_pr}
                        >
                            {
                                isReviewing ?
                                    <span className="flex gap-1 items-center">
                                        Reviewing...
                                        <Spinner />
                                    </span>
                                    :
                                    "AI Review"
                            }
                        </Button>
                    </div>
                    <FieldDescription>
                        Hit the "AI Review" button to let the AI analyze the pull request and provide feedback on potential issues, improvements, and overall code quality.
                    </FieldDescription>
                </Field>
            </div>

            {reviewResults && (
                <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold">Review Results</h3>
                    {reviewResults.map((fileResult) => (
                        <div key={fileResult.file} className="rounded-md border p-4">
                            <h4 className="font-medium break-all">{fileResult.file}</h4>

                            {fileResult.comments.length === 0 ? (
                                <p className="mt-2 text-sm text-muted-foreground">No issues reported for this file.</p>
                            ) : (
                                <div className="mt-3 space-y-2">
                                    {fileResult.comments.map((item, idx) => (
                                        <div key={`${fileResult.file}-${idx}`} className="rounded-md border p-3">
                                            <div className="mb-2 flex items-center gap-2 text-xs">
                                                <span className={`rounded border px-2 py-0.5 font-medium ${getSeverityClass(item.severity)}`}>
                                                    {item.severity.toUpperCase()}
                                                </span>
                                                <span className="text-muted-foreground">Line: {item.line}</span>
                                            </div>
                                            <p className="text-sm">{item.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ReviewerForm