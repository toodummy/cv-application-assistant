# CareerKit — local CV & application assistant

Working checkpoint, Nov 9, 2026 (Moscow, UTC+3). Private local repository; no remote, deployment, live applications, messaging, account signup, paid API, payment collection or customer data ingestion was performed. The app starts with **clearly fictional sample data**, not live jobs or customer claims.

## Run

Requires Node.js 24 and npm (lockfile included).

```sh
npm ci
npm run dev
# http://127.0.0.1:5178 — loopback only, strict port
npm run check   # lint + typecheck + unit/UI tests + production build
npm run preview
# http://127.0.0.1:4178 — optional local production-build preview
```

## Private desktop preview repair

The parent reported Chrome/automation `ERR_CONNECTION_REFUSED` for loopback although shell HTTP checks were healthy. Box-doctor passed 11/11 checks; inspected browser and shell network namespaces match. No proxy flags were found on inspected browser processes. The root cause is not established and browser QA remains blocked until retested.

A second, static-build-only preview now listens on the actual RFC1918 box interface, **172.30.0.2:5179** (`enp0s3`), not `0.0.0.0` or a public tunnel:

```sh
./node_modules/.bin/vite preview --host 172.30.0.2 --port 5179 --strictPort
# http://172.30.0.2:5179/ — private box desktop retry candidate
```

Shell HTTP 200 is confirmed for this new private URL; real-browser access is not yet confirmed. It serves only the built static demo, not the dev filesystem. Original loopback dev server remains running. No firewall, routing, browser, reverse proxy, remote repository or public deployment was changed. Use only synthetic data for QA. If the private URL also fails, report the preview-access blocker rather than expose it publicly.

The development server must remain local. Do not expose it to the internet or change binding to 0.0.0.0 as a deployment shortcut. No remote was chosen because the user did not name one; `gh api user --jq .login` returned `toodummy`. No GitHub repository, push or PR was created. The CI file is prepared but has **not run on GitHub**.

## What actually works

- Structured profile editor for experience, individual verified skills and verified education. Editing an experience/skill/education fact clears its verification flag. Unverified qualifications do not enter exports or suggestions.
- Two original single-column layouts (Classic/Compact), live escaped-text CV preview, browser print/Save PDF, plain text and generated DOCX.
- Manually pasted job title/company/location/description and public HTTPS reference validation. Separate sample vs personal workspaces; sample handoff is disabled. No live catalogue, scraping, ATS API or account integration.
- Simple exact skill-phrase matching and a bounded vocabulary of requirement gaps; no numerical ATS score or job/qualification guarantee. Verified experience may be reordered, never invented.
- Deterministic editable cover-letter draft from supplied facts. Not an AI-generated output. User-edited free text cannot be checked for truth by the app.
- Local employer-question queue: verbatim question + employer/vacancy + form/message context; in-app pending badge; fact-grounded draft or missing-facts warning. Salary, authorisation, demographics, consent and other sensitive answers are not inferred.
- Explicit answer approval and approved-copy action; exact text/context/time recorded in local history. Changes invalidate approval. No send action or recruiter inbox. Optional unanswered questions can be skipped; drafted/required answers require approval before pack approval.
- Exact current CV/template/letter/answers pack approval; changes invalidate it. Opening an approved manual vacancy only navigates to its URL in a new tab. **No CV, letter or answer is uploaded or submitted.** The handoff status means the user clicked the link; popup blocks or destination loads cannot be independently confirmed.
- Tracker distinguishes needs-user, ready/not sent, handoff opened/not confirmed, and explicitly **self-reported** submission confirmation with user note. No fabricated employer confirmation.
- In-memory state by default. Explicit opt-in device saving is unencrypted localStorage, including answer audit; warning shown. Clear all removes only this app's stored/current data, never unrelated apps. JSON backup export is for portability; a restore/import UI is not yet built. Clipboard/downloads are outside Clear all.

## Quick manual QA (parent/browser reviewer)

1. Open the local URL. Verify visible fictional sample banner. Test keyboard navigation and narrow viewport.
2. Inspect Profile. SQL is unverified; it must not appear in CV or suggestions. Edit an experience: verification must clear. Re-verify only synthetic facts.
3. Vacancies → prepare a sample. Sample employer handoff must stay disabled. Toggle Classic/Compact.
4. Questions → use suggestion, edit, approve, then edit again: approved-copy must become disabled. Work-authorisation/salary questions should get no inferred answer.
5. Application pack → verify exact CV, letter and question answers. Print / Save PDF: print preview must show only the CV, no app chrome or sensitive queue. Check long content, Letter/A4, browser headers/footers, pagination and reading order. Cancel print when done.
6. Download DOCX and open in an available Word/LibreOffice viewer; check Unicode, text and page breaks. DOCX and print styles are not guaranteed identical.
7. Start my workspace → empty personal data, no sample jobs. Use synthetic profile and a known public employer URL only if deliberately testing manual handoff. The app does not verify links or detect phishing. Do not submit an application as part of prototype QA.
8. Turn Save on this device on, reload, then Clear all and reload. Personal data must be gone. After a reload with no save, fictional demo mode is the default, never recovery of personal data.

**Not yet visually verified in a real browser:** desktop/mobile appearance, actual print dialog/PDF, screen reader and Word/LibreOffice rendering. Automated tests use jsdom, not a browser or accessibility certification. No screenshots were captured. The executor did not drive a browser or use browser automation.

## Security scope & deployment blockers

See [THREAT_MODEL.md](THREAT_MODEL.md). This is a local prototype, **not production-ready SaaS**.

- No backend, authentication, tenants or payments exist. Do not claim tested tenant isolation, signed payment webhooks, secure account recovery, compliance or penetration testing.
- Public HTTPS validation rejects scripts, credentials, local/private-literal hosts, IP literals and nonstandard ports. It **does not resolve DNS, verify employer identity, detect every phishing URL or guarantee a safe destination**. The app never fetches job URLs server-side, so it has no URL-fetch SSRF surface in this scope.
- React escapes untrusted pasted text; there is no `dangerouslySetInnerHTML`, raw document upload parser, external analytics, AI call, advertising pixel, social login, remote font or CV telemetry.
- `public/_headers` is a **future static-host header example**, not evidence of a deployment or headers being enforced by Vite dev/preview. It sets strict same-origin CSP and `connect-src 'none'`; no production API is expected. Dev requires Vite local module/HMR connections. Review CSP with a real production server before publishing.
- Device save is readable by scripts running in this origin and by other users of the browser profile. Use session-only mode on shared devices. Origin is not an authenticated tenancy boundary. Local audit is editable and not tamper-proof. Backup/clipboard files are sensitive.
- Add authenticated storage/isolation/abuse controls only if scope changes. Provider-specific platform permission and exact applicant approval are mandatory for any future integration. No universal automatic applying or inbox monitoring promise.
- Trading/payment eligibility, registration where required, founder residence/operating jurisdiction, KYC/bank, tax, consumer/privacy terms, support/refunds and security/release review remain unresolved before commercial launch. U.S. customer focus is not proof of founder residence.
- $0 new external service spend. Bot subscription/usage and engineering time still have real costs. No paid plan was enabled.

## Tooling, dependency audit & licences

React + TypeScript + Vite; Vitest/jsdom + Testing Library; docx (MIT). The exact versions are locked. See `THIRD_PARTY_LICENSES.md` and full runtime notices in `public/third-party-notices.txt`.

An initial npm audit reported **10 moderate development dependency findings**, propagated from minimatch glob-pattern amplification (`GHSA-g3hv-75wg-m249`). No production dependency findings were reported initially. A reviewed explicit override to patched minimatch 11.0.5 was installed and checks rerun. The final audit JSON files record the current results; no audit command can prove all vulnerabilities absent. Keep the override under review when tooling updates, and do not blindly run `npm audit fix --force`.

Original application code is private/unlicensed for public redistribution at this checkpoint. No third-party template or brand assets were copied. The CV layouts are original; fonts are system fonts. Font embedding rights must be reviewed if bundled fonts are added later. A full application licence is a founder decision, not silently chosen here.

## Architecture

- `src/domain.ts`: pure typed fact selection, matching, question approval, exact pack snapshot and handoff state machine.
- `src/storage.ts`: bounded, validated versioned localStorage; opt-in and app-only clearing.
- `src/export.ts`: local text/blob downloads and lazy-loaded DOCX generation.
- `src/App.tsx` / `src/styles.css`: responsive accessible editor, queue, tracker and print-only CV CSS.
- `src/*.test.*`: security/domain/storage/DOM/export checks.
- `.github/workflows/ci.yml`: lint, typecheck, unit tests, build, runtime audit; no deploy job. Configure a $0 stop budget before any future remote CI.

## Current limitations

No raw resume PDF/DOCX import; manual fields/plain text only. No backend sync, recovery, email notifications, inbox integration, live recommendations, automatic submissions, payments or customer validation. Suggestions handle only a few explicit question categories and may be irrelevant; review always. Gap detection uses a small fixed vocabulary, not all requirements. Very long entries may paginate awkwardly and need editing. Print and DOCX accessibility/layout require real-viewer testing. No commercial outcome is claimed.

## Public GitHub Pages demo (Nov 21, 2026)

At the owner's request a static demo is published on GitHub Pages: https://toodummy.github.io/cv-application-assistant/

- Static files only: no backend, analytics, payments, accounts, live job search or application submission.
- A banner states: "Prototype — sample data only, nothing is submitted, data stays in your browser".
- Deployment uses the `gh-pages` branch built with `npm run build:pages` (Vite `base` = `/cv-application-assistant/`). GitHub Pages ignores `public/_headers`, so a CSP `<meta>` tag is also in `index.html`.
- The CI workflow is kept as `docs/ci-workflow.example.yml`: the publishing token lacks the `workflow` scope, so no Actions workflow was pushed.

Earlier notes about the private box preview (172.30.0.2) describe a local QA session only and are not a public endpoint.
