export interface ReviewCommentLike {
  severity: string
}

export interface SeverityCounts {
  errorCount: number
  warningCount: number
  bugCount: number
  infoCount: number
}

const normalizeSeverity = (severity: string) => severity.trim().toLowerCase()

export const getSeverityClass = (severity: string) => {
  const normalizedSeverity = normalizeSeverity(severity)

  if (normalizedSeverity === "bug") {
    return "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-700 dark:border-fuchsia-900/50 dark:bg-fuchsia-950/40 dark:text-fuchsia-300"
  }

  if (normalizedSeverity === "error") {
    return "border-red-200 bg-red-100 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
  }

  if (normalizedSeverity === "warning") {
    return "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
  }

  return "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
}

export const getSeverityCounts = (
  comments: ReviewCommentLike[]
): SeverityCounts => {
  let errorCount = 0
  let warningCount = 0
  let bugCount = 0
  let infoCount = 0

  comments.forEach((item) => {
    const normalizedSeverity = normalizeSeverity(item.severity)

    if (normalizedSeverity === "error") {
      errorCount += 1
      return
    }

    if (normalizedSeverity === "warning") {
      warningCount += 1
      return
    }

    if (normalizedSeverity === "bug") {
      bugCount += 1
      return
    }

    infoCount += 1
  })

  return {
    errorCount,
    warningCount,
    bugCount,
    infoCount,
  }
}

export const getSeverityIconType = (severity: string) => {
  const normalizedSeverity = normalizeSeverity(severity)

  if (normalizedSeverity === "error") {
    return "error"
  }

  if (normalizedSeverity === "warning") {
    return "warning"
  }

  if (normalizedSeverity === "bug") {
    return "bug"
  }

  return null
}
