import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { Bot, Github, LogOut, Moon, Sun } from "lucide-react"

type NavbarUser = {
  login: string
  avatar_url: string | null
}

type NavbarProps = {
  user: NavbarUser | null
  onLogin: () => void
  onLogout: () => void
}

const Navbar = ({ user, onLogin, onLogout }: NavbarProps) => {
  const { theme, setTheme } = useTheme()

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  const isDark = theme === "dark" || (theme === "system" && prefersDark)

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-6">
        <h1 className="flex items-center text-lg font-semibold"><Bot className="mr-2" />AI Pull Request Reviewer</h1>

      <div className="flex flex-wrap items-center gap-2">
        {user ? (
          <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-2 py-1">
            {user.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.login}
                className="h-6 w-6 rounded-full"
              />
            )}
            <span className="text-sm text-foreground">@{user.login}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2"
              onClick={onLogout}
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onLogin}
          >
            <Github className="h-4 w-4" />
            Login with GitHub
          </Button>
        )}

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
      </div>
    </nav>
  )
}

export default Navbar