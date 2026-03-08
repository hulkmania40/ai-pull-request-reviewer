import { useEffect, useMemo, useState } from "react"

import AuthFullscreenLoader from "./components/customComponents/AuthFullscreenLoader"
import Navbar from "./components/customComponents/Navbar"
import ReviewerForm from "./components/customComponents/ReviewerForm/ReviewerForm"
import { _get, _post } from "./lib/apiClient"

type AuthUser = {
  id: number
  github_id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

const AUTH_TOKEN_STORAGE_KEY = "auth_token"

type AuthAction = "authorize" | "logout"

export function App() {
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [authAction, setAuthAction] = useState<AuthAction>("authorize")

  const apiBaseUrl = useMemo(
    () => (import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? ""),
    []
  )

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
    const tokenFromHash = hashParams.get("auth_token")

    if (tokenFromHash) {
      setAuthAction("authorize")
      setIsAuthorizing(true)
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, tokenFromHash)
      setAuthToken(tokenFromHash)
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${window.location.search}`
      )
      return
    }

    const savedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
    if (savedToken) {
      setAuthToken(savedToken)
    }
  }, [])

  useEffect(() => {
    const loadUser = async () => {
      if (!authToken) {
        setAuthUser(null)
        setIsAuthorizing(false)
        return
      }

      setIsAuthorizing(true)
      setAuthAction("authorize")

      const res = await _get<AuthUser>("/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (res.ok) {
        setAuthUser(res.data)
        setIsAuthorizing(false)
        return
      }

      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
      setAuthToken(null)
      setAuthUser(null)
      setIsAuthorizing(false)
    }

    void loadUser()
  }, [authToken])

  const handleLogin = () => {
    setAuthAction("authorize")
    setIsAuthorizing(true)
    const loginUrl = apiBaseUrl ? `${apiBaseUrl}/auth/github/login` : "/auth/github/login"
    window.location.href = loginUrl
  }

  const handleLogout = async () => {
    setAuthAction("logout")
    setIsAuthorizing(true)

    if (authToken) {
      await _post<undefined>("/auth/logout", undefined, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
    }

    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    setAuthToken(null)
    setAuthUser(null)
    setIsAuthorizing(false)
    setAuthAction("authorize")
  }

  const loaderContent =
    authAction === "logout"
      ? {
          title: "Logging Out",
          description: "Please wait while we securely log you out.",
        }
      : {
          title: "Authorizing User",
          description:
            "Please wait while we securely authorize your GitHub account.",
        }

  return (
    <div className="mx-auto min-h-svh w-full max-w-6xl px-4 sm:px-6">
      {isAuthorizing && (
        <AuthFullscreenLoader
          title={loaderContent.title}
          description={loaderContent.description}
        />
      )}
      <Navbar user={authUser} onLogin={handleLogin} onLogout={handleLogout} />
      <main className="py-4 sm:py-6">
        <ReviewerForm />
      </main>
    </div>
  )
}

export default App
