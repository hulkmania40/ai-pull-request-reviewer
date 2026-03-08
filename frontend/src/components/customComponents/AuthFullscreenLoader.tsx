import { Spinner } from "@/components/ui/spinner"

type AuthFullscreenLoaderProps = {
  title: string
  description: string
}

const AuthFullscreenLoader = ({ title, description }: AuthFullscreenLoaderProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <Spinner className="size-7" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export default AuthFullscreenLoader
