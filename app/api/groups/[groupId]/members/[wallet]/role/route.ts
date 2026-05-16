export const runtime = "edge"

import { isFundModeRole } from "@/lib/fund-mode-roles"
import { FundWiseError } from "@/lib/server/fundwise-error"
import { setMemberRoleMutation } from "@/lib/server/mutations/member"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

type SetMemberRoleBody = { role?: string }

type SetMemberRoleParams = { groupId: string; wallet: string }

export const POST = withAuthenticatedHandler<SetMemberRoleBody, SetMemberRoleParams>(
  {
    fallbackMessage: "Failed to update Member role.",
    rateLimit: "member_role",
  },
  async ({ session, body, params }) => {
    if (!params.groupId || !params.wallet) {
      throw new FundWiseError("Missing Group or target wallet.")
    }

    if (!body.role || !isFundModeRole(body.role)) {
      throw new FundWiseError("Role must be admin, member, or viewer.")
    }

    return setMemberRoleMutation({
      groupId: params.groupId,
      actorWallet: session.wallet,
      targetWallet: params.wallet,
      role: body.role,
    })
  }
)
