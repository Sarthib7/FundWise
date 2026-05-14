/**
 * Approval-threshold guidance for Fund Mode Treasury initialization.
 *
 * Picking a Squads threshold is the single biggest UX cliff for non-crypto
 * users in a Fund Mode Group. These helpers turn the current Member count into
 * a recommended threshold and a one-line explanation that the dashboard can
 * surface next to the user's current setting.
 *
 * Suggestion policy (FW-057):
 *   - 1 Member: 1/1 — sole-creator setup (degenerate, but allowed).
 *   - 2 Members: 2/2 — both must sign; no single point of approval.
 *   - 3-5 Members: majority — ceil((n + 1) / 2).
 *   - 6+ Members: half + 1 — floor(n / 2) + 1.
 *
 * Beta testers tend to under-shoot (1-of-N) which removes the entire point of
 * a multisig, or over-shoot (N-of-N) which makes the pool unusable if anyone
 * drops off. Suggestions plus the "what this means" copy nudge them to a
 * working middle.
 */

export type ThresholdSuggestion = {
  threshold: number
  rationale: string
}

export function suggestApprovalThreshold(memberCount: number): ThresholdSuggestion {
  const safeMemberCount = Number.isFinite(memberCount) && memberCount > 0 ? Math.floor(memberCount) : 1

  if (safeMemberCount <= 1) {
    return {
      threshold: 1,
      rationale: "Sole-creator Treasury. Add Members and raise the threshold before moving real funds.",
    }
  }

  if (safeMemberCount === 2) {
    return {
      threshold: 2,
      rationale: "Both Members must approve every Treasury action. Safe default for two-person pools.",
    }
  }

  if (safeMemberCount <= 5) {
    const majority = Math.ceil((safeMemberCount + 1) / 2)
    return {
      threshold: majority,
      rationale: `Majority approval. ${majority} of ${safeMemberCount} Members must sign each Treasury action.`,
    }
  }

  const halfPlusOne = Math.floor(safeMemberCount / 2) + 1
  return {
    threshold: halfPlusOne,
    rationale: `Half-plus-one. ${halfPlusOne} of ${safeMemberCount} Members must sign each Treasury action. Resilient to a few inactive Members.`,
  }
}

export function describeApprovalThreshold(threshold: number, memberCount: number): string {
  const safeThreshold = Math.max(1, Math.floor(threshold))
  const safeMemberCount = Math.max(safeThreshold, Math.floor(memberCount))

  if (safeThreshold === safeMemberCount) {
    return `Every Member (${safeThreshold} of ${safeMemberCount}) must approve each Treasury action.`
  }

  if (safeThreshold === 1) {
    return `Any single Member out of ${safeMemberCount} can approve each Treasury action. Treat this as no real multisig protection.`
  }

  return `${safeThreshold} of ${safeMemberCount} Members must approve each Treasury action.`
}
