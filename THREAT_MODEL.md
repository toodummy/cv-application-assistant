# Local prototype threat model

As of Nov 9, 2026 (Moscow, UTC+3). Scope: one browser process/profile, static app, optional localStorage, downloads/clipboard and user-clicked external vacancy URL. No server data store or authentication.

| Asset / threat | Current control | Residual risk / release gate |
|---|---|---|
| CV/answer privacy | No network data path; memory by default; opt-in save; clear app key; no telemetry | LocalStorage/clipboard/downloads unencrypted; compromised browser/origin/device can read them. Do not use real sensitive data in pilot QA. |
| Pasted text XSS / instruction injection | React text rendering, no HTML evaluation/model/tools; bounded fields | Free-text truth cannot be established. Dependency compromise remains possible. |
| Bad employer URL / javascript | Public HTTPS-only syntax check, no credentials/IP literals/private host suffix/port; no automatic fetch | DNS/private routing/phishing/redirects not resolved. User must verify employer; external navigation is not integration permission. |
| False CV qualifications | Only verified structured facts selected; edits reset verification; source facts shown for suggestions | Applicant can mark false facts verified or manually edit letter/answer; product does not certify truth. |
| Unapproved answer / wrong destination | Exact question/employer/vacancy/profile/answer snapshot; edits invalidate approval; copy only | Clipboard can be pasted incorrectly. No external send exists. Future sends require server-side authorisation and immutable approval binding. |
| Fake application confirmation | Ready != handoff != explicitly self-reported confirmation | Handoff event records click, not page load; user note not independently verified. |
| Data corruption / oversized storage | Version/schema/size validation; save errors shown; bounded history | Default memory lost on reload; no backup restore UI yet. Prototype save cap 1MB; user's JSON export can help manual recovery. |
| Session/tenant confusion | Separate demo/personal state; demo handoff disabled; clear operation | No multiuser accounts. Do not call origin storage a secure tenant boundary. |
| Dependency / build supply chain | Lockfile, licence inventory, audit, lint/type/test/build | CI actions need SHA pinning and dependency update policy before remote use. Audit misses unknown issues. |
| Production exposure | Loopback-only strict-port dev command; no remote or deploy; future CSP header example | Vite dev is not a production boundary. Public deployment needs security headers validated, privacy/legal review and operating controls. |

No password/secret collection, payment processor, arbitrary-URL server fetch, file parser, plugin/extension, authentication or webhook exists. Their security requirements are **deferred, not implemented**. No pen-test or compliance promises.

Before any real launch: complete synthetic browser/print/Word/accessibility QA; product/customer evidence; lawful seller/provider setup; inspect production network and CSP; release-specific threat review; support/refund/deletion and incident process. Keep CVs out of logs, repositories, CI artifacts and public issues. All external publication/spend/sends remain approval-gated.
