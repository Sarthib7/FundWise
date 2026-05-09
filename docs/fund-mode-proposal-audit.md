# Fund Mode Proposal Audit Trail

Fund Mode Proposal money authority lives in Squads. FundWise stores off-chain audit metadata for UX and history: memo text, one external proof link, Proposal-scoped comments, and edit history.

File upload is intentionally not shipped yet. Proof uses a user-provided `http` or `https` link capped at 500 characters. Before native file upload ships, storage rules must define bucket privacy, per-Group authorization, max file size, allowed MIME types, retention, deletion, and malware scanning expectations.

Editable fields are limited to `memo` and `proof_url`. Recipient, amount, mint, and Squads transaction metadata are immutable because they are already anchored in the Squads transaction. The creator can edit metadata only while the Proposal is pending and before the first outside approval.
