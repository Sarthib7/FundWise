/**
 * Safe USDC amount parser for LI.FI top-up inputs.
 *
 * USDC has 6 decimals on every chain. This module converts a human-readable
 * USDC string into the integer smallest-unit string that LI.FI expects,
 * without using floating-point arithmetic.
 *
 * Rejected: malformed, non-finite, zero/negative, more than 6 decimals,
 * unsafe integer raw amounts, and empty/whitespace-only strings.
 */

export type ParsedUsdcAmount =
  | { ok: true; human: string; smallestUnit: string }
  | { ok: false; error: string }

/**
 * Parse and validate a human-readable USDC amount string.
 * Returns either the validated amounts or a human-readable error.
 */
export function parseUsdcAmount(input: string): ParsedUsdcAmount {
  const trimmed = input.trim()

  if (trimmed === "") {
    return { ok: false, error: "Enter a USDC amount." }
  }

  // Reject obvious non-numeric garbage early. The previous regex /^\d*\.?\d*$/
  // accepted a bare "." (both \d* match empty); FW-056 tightens it so at
  // least one digit must appear on either side of the optional decimal point.
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(trimmed)) {
    return { ok: false, error: "Amount must be a plain number." }
  }

  // Split into integer and fractional parts
  const [intPart, fracPart = ""] = trimmed.split(".")

  // Reject leading zeros on multi-digit integers (e.g. "012")
  if (intPart.length > 1 && intPart.startsWith("0")) {
    return { ok: false, error: "Amount must not have leading zeros." }
  }

  // Reject more than 6 decimal places (USDC precision)
  if (fracPart.length > 6) {
    return { ok: false, error: "USDC supports at most 6 decimal places." }
  }

  // Build the integer smallest-unit string without floating point.
  // e.g. "10.5" -> "10500000", "0.000001" -> "1"
  const paddedFrac = fracPart.padEnd(6, "0")
  const rawSmallest = intPart + paddedFrac

  // Strip leading zeros but keep at least one digit
  const smallestUnit = rawSmallest.replace(/^0+/, "") || "0"

  // Reject zero
  if (smallestUnit === "0") {
    return { ok: false, error: "Amount must be greater than zero." }
  }

  // Reject unsafe integer (JS Number.MAX_SAFE_INTEGER = 9007199254740991)
  if (smallestUnit.length > 16) {
    return { ok: false, error: "Amount is too large." }
  }

  // Double-check it fits in a safe JS integer
  const smallestNum = Number(smallestUnit)
  if (!Number.isSafeInteger(smallestNum)) {
    return { ok: false, error: "Amount is too large." }
  }

  return {
    ok: true,
    human: trimmed,
    smallestUnit,
  }
}
