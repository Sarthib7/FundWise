export type FundModeTemplateId = "trip_pool" | "friend_fund" | "dao_grant" | "family_budget"

export type FundModeTemplate = {
  id: FundModeTemplateId
  label: string
  description: string
  approvalThreshold: number
  defaultMemo: string
  roleHint: string
}

export const FUND_MODE_TEMPLATES: FundModeTemplate[] = [
  {
    id: "trip_pool",
    label: "Trip pool",
    description: "A short-lived Treasury for travel costs, bookings, and reimbursements.",
    approvalThreshold: 2,
    defaultMemo: "Reimburse trip expense",
    roleHint: "Organizer as Admin; travelers as Members.",
  },
  {
    id: "friend_fund",
    label: "Friend fund",
    description: "A recurring shared pot for friend groups that spend together often.",
    approvalThreshold: 2,
    defaultMemo: "Reimburse shared fund expense",
    roleHint: "Trusted contributors as Members; casual observers as Viewers later.",
  },
  {
    id: "dao_grant",
    label: "DAO grant",
    description: "A controlled grant budget with stronger review before reimbursement.",
    approvalThreshold: 3,
    defaultMemo: "Grant reimbursement request",
    roleHint: "Grant leads as Admins; reviewers as Members; applicants as Viewers later.",
  },
  {
    id: "family_budget",
    label: "Family budget",
    description: "A household or family Treasury for recurring shared expenses.",
    approvalThreshold: 2,
    defaultMemo: "Household reimbursement",
    roleHint: "Caretakers as Admins; family contributors as Members.",
  },
]

const TEMPLATE_IDS = new Set(FUND_MODE_TEMPLATES.map((template) => template.id))

export function isFundModeTemplateId(value: string): value is FundModeTemplateId {
  return TEMPLATE_IDS.has(value as FundModeTemplateId)
}

export function getFundModeTemplate(id: FundModeTemplateId) {
  return FUND_MODE_TEMPLATES.find((template) => template.id === id) ?? null
}
