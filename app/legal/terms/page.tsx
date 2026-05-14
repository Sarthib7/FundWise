export const metadata = {
  title: "Terms of Service · FundWise",
  description: "Draft terms of service for FundWise. Pending legal review.",
}

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p>
        <em>Last updated: 2026-05-11 — Draft v0.</em>
      </p>

      <p>
        By accessing or using FundWise (the &ldquo;Service&rdquo;), you agree to these Terms. If
        you do not agree, do not use the Service.
      </p>

      <h2>Eligibility</h2>
      <p>
        You must be at least 18 years old and legally able to enter into a binding contract to use
        FundWise.
      </p>

      <h2>Wallet-based identity, non-custodial Service</h2>
      <p>
        FundWise authenticates you through a Solana wallet you control. FundWise never takes
        custody of your USDC, SOL, or any other asset. Every transaction is signed by your wallet
        and submitted to the Solana network; FundWise does not have the ability to move funds
        without your wallet&rsquo;s signature.
      </p>

      <h2>Third-party assets and infrastructure</h2>
      <p>
        FundWise relies on third-party assets (such as USDC issued by Circle and other stablecoins)
        and third-party infrastructure (such as the Solana blockchain, RPC providers, Supabase,
        Cloudflare, LI.FI, and Zerion). FundWise does not control those parties and is not liable
        for their actions, outages, decisions to freeze or de-peg assets, or changes in their
        terms.
      </p>

      <h2>User responsibilities</h2>
      <ul>
        <li>Keep your private keys, seed phrases, and devices secure.</li>
        <li>
          Provide accurate information you choose to share (display name, group context, proposal
          memos, proof links).
        </li>
        <li>Pay your own network fees (SOL for Solana gas) and any third-party routing fees.</li>
        <li>Use FundWise only for lawful purposes.</li>
      </ul>

      <h2>Prohibited uses</h2>
      <p>You may not use FundWise to:</p>
      <ul>
        <li>Engage in money laundering, terrorism financing, sanctions evasion, or tax evasion.</li>
        <li>
          Transact from or on behalf of any wallet, person, or entity appearing on a U.S. OFAC SDN
          list, an EU sanctions list, or a comparable applicable list.
        </li>
        <li>Defraud, harass, threaten, or impersonate any person or group.</li>
        <li>Interfere with the Service, attempt unauthorized access, or scrape private data.</li>
      </ul>

      <h2>Disclaimer of warranties</h2>
      <p>
        FundWise is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; To the maximum
        extent permitted by law, FundWise disclaims all warranties, express or implied, including
        merchantability, fitness for a particular purpose, and non-infringement. FundWise does not
        warrant that the Service will be uninterrupted, error-free, or secure.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, FundWise and FundLabs will not be liable for any
        indirect, incidental, special, consequential, or punitive damages, or for any loss of
        funds, profits, data, goodwill, or other intangible losses arising from your use of the
        Service.
      </p>

      <h2>Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of the jurisdiction in which FundLabs is organized
        (to be specified before mainnet launch). Disputes will be resolved through informal
        good-faith negotiation first, then through the dispute resolution mechanism specified in
        the final published Terms.
      </p>

      <h2>Suspension and termination</h2>
      <p>
        FundWise may suspend or restrict access from any wallet, IP, or account that we reasonably
        believe is engaged in prohibited uses or is creating a security or compliance risk.
      </p>

      <h2>Changes to these Terms</h2>
      <p>
        FundWise will post material changes on{" "}
        <a href="https://x.com/funddotsol" target="_blank" rel="noopener noreferrer">x.com/funddotsol</a>{" "}
        and{" "}
        <a href="https://t.me/funddotsol" target="_blank" rel="noopener noreferrer">t.me/funddotsol</a>{" "}
        before they take effect. Continued use after the effective date constitutes acceptance.
      </p>

      <h2>Contact</h2>
      <p>
        Questions go to{" "}
        <a href="https://t.me/funddotsol" target="_blank" rel="noopener noreferrer">t.me/funddotsol</a>{" "}
        until a dedicated contact channel is published.
      </p>
    </>
  )
}
