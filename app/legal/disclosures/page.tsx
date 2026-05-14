export const metadata = {
  title: "Disclosures · FundWise",
  description: "Risk disclosures for FundWise. Pending legal review.",
}

export default function DisclosuresPage() {
  return (
    <>
      <h1>Risk Disclosures</h1>
      <p>
        <em>Last updated: 2026-05-11 — Draft v0.</em>
      </p>

      <p>
        FundWise is built on public blockchains and third-party infrastructure. Using FundWise
        exposes you to risks that do not exist in traditional banking. Read these disclosures
        carefully alongside our <a href="/legal/terms">Terms of Service</a> and{" "}
        <a href="/legal/privacy">Privacy Policy</a>.
      </p>

      <h2>Non-custodial. No FDIC or equivalent insurance.</h2>
      <p>
        FundWise never holds your USDC, SOL, or any other asset. There is no FDIC, SIPC, or
        equivalent insurance. If you lose your private key, FundWise cannot recover your funds.
      </p>

      <h2>Smart contract risk</h2>
      <p>
        Fund Mode treasuries are operated through the Squads multisig program. Any smart contract,
        including Squads and the SPL Token program, may contain undiscovered bugs. Audits reduce
        risk but do not eliminate it.
      </p>

      <h2>Stablecoin risk</h2>
      <p>
        FundWise uses USDC issued by Circle as its primary settlement asset, and supports USDT
        (Tether) and PYUSD (PayPal) on certain Groups. Stablecoins can de-peg, be frozen by their
        issuer, or be subject to regulatory action. FundWise does not control issuer behavior.
      </p>

      <h2>Network risk</h2>
      <p>
        The Solana network can be congested, halted, or unavailable. Transactions you sign may
        fail to confirm, or may confirm later than expected. RPC providers can rate-limit or fail.
        FundWise routes around RPC issues where possible but cannot guarantee delivery.
      </p>

      <h2>Fees and gas</h2>
      <p>
        Solana transaction fees, account-creation rent, and any third-party routing fees (e.g.
        LI.FI) are paid from your wallet at the time of each transaction. FundWise itself does
        not currently charge a Split Mode settlement fee. Fund Mode may charge a creation fee at
        Treasury initialization once mainnet is open; this will be disclosed at the moment of
        charging.
      </p>

      <h2>Beta status of Fund Mode</h2>
      <p>
        Fund Mode is currently an invite-only beta on Solana devnet. Devnet USDC has no real
        value. Fund Mode behavior, pricing, and feature scope may change before any mainnet
        release. Do not treat devnet test transactions as financial records.
      </p>

      <h2>No investment, tax, or legal advice</h2>
      <p>
        FundWise is a tool, not a financial advisor. Nothing in the app constitutes investment,
        tax, accounting, or legal advice. Consult your own professionals for those needs.
      </p>

      <h2>Regulatory risk</h2>
      <p>
        Cryptocurrency regulation continues to evolve in many jurisdictions. Features available
        today may be restricted or removed in the future to comply with applicable law.
      </p>

      <h2>Your responsibility</h2>
      <p>
        You are responsible for understanding these risks before you connect a wallet, contribute
        to a Treasury, or sign a Settlement. If you do not accept these risks, do not use
        FundWise.
      </p>
    </>
  )
}
