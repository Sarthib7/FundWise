export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export type ApiFetchInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | unknown[] | null
}

export async function apiFetch<T>(
  path: string,
  init: ApiFetchInit = {}
): Promise<T> {
  const { body, headers: callerHeaders, cache, credentials, ...rest } = init

  const serializedBody =
    body === null || body === undefined || typeof body === "string" || body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer
      ? (body as BodyInit | null | undefined)
      : JSON.stringify(body)

  const shouldSetJsonHeader =
    serializedBody !== null && serializedBody !== undefined && typeof serializedBody === "string"

  const response = await fetch(path, {
    cache: cache ?? "no-store",
    credentials: credentials ?? "same-origin",
    ...rest,
    body: serializedBody,
    headers: {
      ...(shouldSetJsonHeader ? { "Content-Type": "application/json" } : {}),
      ...(callerHeaders || {}),
    },
  })

  const text = await response.text()
  let parsed: unknown = null
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text)
    } catch {
      if (!response.ok) {
        throw new ApiError(
          `Request failed with status ${response.status}`,
          response.status
        )
      }
      throw new ApiError("Response is not valid JSON.", response.status)
    }
  }

  if (!response.ok) {
    const errorMessage =
      parsed &&
      typeof parsed === "object" &&
      "error" in parsed &&
      typeof (parsed as { error?: unknown }).error === "string"
        ? (parsed as { error: string }).error
        : `Request failed with status ${response.status}`
    throw new ApiError(errorMessage, response.status)
  }

  return parsed as T
}
