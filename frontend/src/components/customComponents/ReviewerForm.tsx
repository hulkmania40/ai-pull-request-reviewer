import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { _get, _post } from "@/lib/apiClient"
import { Spinner } from "@/components/ui/spinner"

interface validatePRResponse {
  "owner": string,
  "repo": string,
  "pull_number": string,
  "is_valid_pr": boolean,
  "message": string
}

const ReviewerForm = () => {

    const [inputUrl, setInputUrl] = useState("")
    const [isValidating, setIsValidating] = useState(false)
    
    const validatePr = async (url: string) => {
        const payload = {
            "url": url
        }
        const res: validatePRResponse = await _post("/reviews/parse-pr", payload)
        setIsValidating(false)
        if(res.is_valid_pr){
            console.log(res)
        } else {
            alert("Failed to validate PR: " + res.message)
        }
    }

    return (
        <div>
            <div className="flex items-center gap-2">
                <Field>
                    <FieldLabel htmlFor="input-field-pr-url">Enter the PR URL</FieldLabel>
                    <Input
                        id="input-field-pr-url"
                        type="text"
                        placeholder="https://github.com/user/repo/pull/1"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                    />
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
                    disabled={isValidating}
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
        </div>
    )
}

export default ReviewerForm