import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { Bot, Moon, Sun } from "lucide-react"

const Navbar = () => {
  const { theme, setTheme } = useTheme()

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  const isDark = theme === "dark" || (theme === "system" && prefersDark)

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <nav className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="flex items-center text-lg font-semibold"><Bot className="mr-2" />AI Pull Request Reviewer</h1>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? "Light" : "Dark"}
        </Button>
    </nav>
  )
}

export default Navbar