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
    return {
      status: error.status,
      message: error.message,
    }
  }

  if (error instanceof Error) {
    return {
      status: 400,
      message: error.message,
    }
  }

  return {
    status: 500,
    message: fallbackMessage,
  }
}
