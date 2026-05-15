import { describe, expect, it } from "vitest"
import { describeRole, isFundModeRole, roleCan } from "@/lib/fund-mode-roles"

describe("isFundModeRole", () => {
  it("accepts admin, member, viewer", () => {
    expect(isFundModeRole("admin")).toBe(true)
    expect(isFundModeRole("member")).toBe(true)
    expect(isFundModeRole("viewer")).toBe(true)
  })

  it("rejects unknown roles", () => {
    expect(isFundModeRole("owner")).toBe(false)
    expect(isFundModeRole("")).toBe(false)
    expect(isFundModeRole(undefined)).toBe(false)
    expect(isFundModeRole(null)).toBe(false)
    expect(isFundModeRole(42)).toBe(false)
  })
})

describe("roleCan", () => {
  it("admin has every action", () => {
    expect(roleCan("admin", "invite_member")).toBe(true)
    expect(roleCan("admin", "change_role")).toBe(true)
    expect(roleCan("admin", "change_threshold")).toBe(true)
    expect(roleCan("admin", "create_proposal")).toBe(true)
    expect(roleCan("admin", "review_proposal")).toBe(true)
    expect(roleCan("admin", "execute_proposal")).toBe(true)
    expect(roleCan("admin", "contribute")).toBe(true)
    expect(roleCan("admin", "read")).toBe(true)
  })

  it("member can propose/review/execute/contribute but cannot manage Group", () => {
    expect(roleCan("member", "create_proposal")).toBe(true)
    expect(roleCan("member", "review_proposal")).toBe(true)
    expect(roleCan("member", "execute_proposal")).toBe(true)
    expect(roleCan("member", "contribute")).toBe(true)
    expect(roleCan("member", "invite_member")).toBe(false)
    expect(roleCan("member", "change_role")).toBe(false)
    expect(roleCan("member", "change_threshold")).toBe(false)
  })

  it("viewer can read and comment but cannot move money or vote", () => {
    expect(roleCan("viewer", "read")).toBe(true)
    expect(roleCan("viewer", "comment_proposal")).toBe(true)
    expect(roleCan("viewer", "review_proposal")).toBe(false)
    expect(roleCan("viewer", "execute_proposal")).toBe(false)
    expect(roleCan("viewer", "contribute")).toBe(false)
    expect(roleCan("viewer", "create_proposal")).toBe(false)
  })
})

describe("describeRole", () => {
  it("returns a non-empty description for every role", () => {
    expect(describeRole("admin")).toMatch(/Manages threshold/)
    expect(describeRole("member")).toMatch(/propose/)
    expect(describeRole("viewer")).toMatch(/Read-only/)
  })
})
