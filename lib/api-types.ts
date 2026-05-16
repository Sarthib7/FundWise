import type { Database } from "@/lib/database.types"

type GroupRow = Database["public"]["Tables"]["groups"]["Row"]
type MemberRow = Database["public"]["Tables"]["members"]["Row"]
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"]
type ExpenseSplitRow = Database["public"]["Tables"]["expense_splits"]["Row"]
type SettlementRow = Database["public"]["Tables"]["settlements"]["Row"]
type ContributionRow = Database["public"]["Tables"]["contributions"]["Row"]
type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"]
type ProposalReviewRow = Database["public"]["Tables"]["proposal_approvals"]["Row"]
type ProposalCommentRow = Database["public"]["Tables"]["proposal_comments"]["Row"]
type ProposalEditRow = Database["public"]["Tables"]["proposal_edits"]["Row"]

export type ProposalWithReviews = ProposalRow & {
  reviews: ProposalReviewRow[]
  comments: ProposalCommentRow[]
  edits: ProposalEditRow[]
}

export type ActivityItem =
  | { type: "expense"; data: ExpenseRow & { splits: ExpenseSplitRow[] } }
  | { type: "settlement"; data: SettlementRow }

export type GroupDashboardSnapshot = {
  authenticated: boolean
  isMember: boolean
  memberCount: number
  group: GroupRow | null
  members: MemberRow[]
  activity: ActivityItem[]
  contributions: ContributionRow[]
  proposals: ProposalWithReviews[]
}

export type SettlementReceiptView = {
  group: GroupRow
  members: MemberRow[]
  settlement: SettlementRow
}
