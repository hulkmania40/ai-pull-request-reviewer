type Primitive = string | number | boolean

type QueryParams = Record<string, Primitive | null | undefined>

type RequestOptions = {
  headers?: HeadersInit
  params?: QueryParams
  signal?: AbortSignal
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? ""

function buildUrl(path: string, params?: QueryParams): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const url = new URL(`${API_BASE_URL}${normalizedPath}`, window.location.origin)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, String(value))
      }
    }
  }

  return url.toString()
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(buildUrl(path, options.params), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: options.signal,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get("content-type") ?? ""
  const isJson = contentType.includes("application/json")
  const responseData = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      typeof responseData === "object" && responseData && "message" in responseData
        ? String((responseData as { message: unknown }).message)
        : `Request failed with status ${response.status}`

    throw new Error(message)
  }

  return responseData as T
}

export function _get<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>("GET", path, undefined, options)
}

export function _post<T, B = unknown>(path: string, body?: B, options?: RequestOptions): Promise<T> {
  return request<T>("POST", path, body, options)
}

export function _put<T, B = unknown>(path: string, body?: B, options?: RequestOptions): Promise<T> {
  return request<T>("PUT", path, body, options)
}

export function _delete<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>("DELETE", path, undefined, options)
}
