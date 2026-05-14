import { reportError } from "@/lib/server/monitoring"

export class FundWiseError extends Error {
  status: number

  constructor(message: string, status: number = 400) {
    super(message)
    this.name = "FundWiseError"
    this.status = status
  }
}

export function getErrorDetails(error: unknown, fallbackMessage: string) {
  if (error instanceof FundWiseError) {
    // Only forward unexpected (5xx) FundWiseErrors to monitoring — expected
    // 4xx user-input failures would drown out real signals.
    if (error.status >= 500) {
      reportError(error)
    }
    return {
      status: error.status,
      message: error.message,
    }
  }

  if (error instanceof Error) {
    reportError(error)
    return {
      status: 400,
      message: error.message,
    }
  }

  reportError(error, { fallbackMessage })
  return {
    status: 500,
    message: fallbackMessage,
  }
}
