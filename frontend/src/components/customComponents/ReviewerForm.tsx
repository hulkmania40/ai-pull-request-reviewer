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

const ReviewerForm = () => {

    const [inputUrl, setInputUrl] = useState("")
    const [isValidating, setIsValidating] = useState(false)
    const [ validationResult, setValidationResult] = useState<validatePRResponse | null>(null)
    
    const validatePr = async (url: string) => {
        const payload = {
            "url": url
        }
        const res = await _post<validatePRResponse, { url: string }>("/reviews/parse-pr", payload)

        if (res.ok) {
            if(res.data.is_valid_pr){
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
                    onClick={()=>{
                        setIsValidating(true)
                        validatePr(inputUrl)
                    }}
                    disabled={isValidating || validationResult !== null}
                >
                    {
                        isValidating?
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
        </div>
    )
}

export default ReviewerForm