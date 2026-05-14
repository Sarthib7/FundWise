export const metadata = {
  title: "Privacy Policy · FundWise",
  description: "Draft privacy policy for FundWise. Pending legal review.",
}

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>
        <em>Last updated: 2026-05-11 — Draft v0.</em>
      </p>

      <p>
        FundWise (a product of FundLabs) is a non-custodial shared-finance application that runs
        on the Solana blockchain. This Privacy Policy describes what data we collect, how we use
        it, and what choices you have. Read it together with our{" "}
        <a href="/legal/terms">Terms of Service</a> and{" "}
        <a href="/legal/disclosures">Disclosures</a>.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Wallet address.</strong> Your Solana public key, which is public on-chain by
          design. We treat it as your identity in FundWise.
        </li>
        <li>
          <strong>Display name.</strong> An optional name you set in your FundWise profile so other
          Group members can recognize you.
        </li>
        <li>
          <strong>Group and ledger data.</strong> Group names, member lists, expense entries,
          settlement records, contributions, proposals, comments, edit history, and the on-chain
          transaction signatures linked to those events.
        </li>
        <li>
          <strong>Session cookies.</strong> An HMAC-signed, httpOnly cookie that proves your wallet
          has completed a wallet-signed challenge in this browser. The cookie does not contain a
          long-lived secret.
        </li>
        <li>
          <strong>Operational logs.</strong> Standard server logs (timestamp, route, response
          status, IP, user-agent) retained for debugging and abuse prevention.
        </li>
      </ul>

      <h2>Information we never collect</h2>
      <ul>
        <li>Private keys or seed phrases.</li>
        <li>Government-issued ID, KYC documents, or biometric data.</li>
        <li>Bank account numbers, card numbers, or any payment instrument.</li>
        <li>Your real-world identity beyond an optional display name you choose to share.</li>
      </ul>

      <h2>Third parties</h2>
      <p>FundWise uses these third parties to operate the product:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — hosts the FundWise database that stores Groups, expenses,
          settlements, and related metadata.
        </li>
        <li>
          <strong>Cloudflare</strong> — DNS, edge delivery, and DDoS protection for the FundWise
          web app.
        </li>
        <li>
          <strong>Helius and other Solana RPC providers</strong> — read and write on Solana on your
          behalf when your wallet signs a transaction.
        </li>
        <li>
          <strong>LI.FI</strong> — when you use the optional &ldquo;Route funds&rdquo; flow, LI.FI
          quotes and executes the cross-chain swap. Your address and route choice are shared with
          LI.FI for that request.
        </li>
        <li>
          <strong>Zerion</strong> — the optional wallet-readiness CLI calls Zerion APIs to read
          public on-chain data about your wallet.
        </li>
      </ul>

      <h2>Your rights</h2>
      <ul>
        <li>
          <strong>Delete account.</strong> You can request deletion of your FundWise profile and
          related off-chain rows. On-chain transactions and your wallet address itself cannot be
          deleted from Solana.
        </li>
        <li>
          <strong>Export.</strong> You can request a JSON export of your Group memberships,
          expenses, settlements, and contribution history.
        </li>
        <li>
          <strong>GDPR / CCPA.</strong> If you are a resident of a jurisdiction granting additional
          rights, contact us via the Telegram channel below to exercise them.
        </li>
      </ul>

      <h2>Children</h2>
      <p>
        FundWise is not directed to anyone under the age of 18. Do not use FundWise if you are
        under 18.
      </p>

      <h2>Changes</h2>
      <p>
        We will update this policy when our practices change. Material changes will be announced on{" "}
        <a href="https://x.com/funddotsol" target="_blank" rel="noopener noreferrer">x.com/funddotsol</a>{" "}
        and{" "}
        <a href="https://t.me/funddotsol" target="_blank" rel="noopener noreferrer">t.me/funddotsol</a>.
      </p>

      <h2>Contact</h2>
      <p>
        Send privacy questions to{" "}
        <a href="https://t.me/funddotsol" target="_blank" rel="noopener noreferrer">t.me/funddotsol</a>{" "}
        until a dedicated contact channel is published.
      </p>
    </>
  )
}
