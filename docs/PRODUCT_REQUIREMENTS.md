# Product requirements

Scope date: 2026-10-15. Source: user master prompt. UAE, university students/fresh graduates aged 18+ and verified employers. Education and employment should complement a student's time.

## Journeys

Student: exactly four primary destinations Home, Explore, Applications, Profile. Home shows saved-profile recommendations and current interviews/placements. Explore searches real open/unexpired AE/AED student-friendly jobs with type, emirate, pay period/rate, remote and availability filters. Applications shows durable status, employer messages, interviews, offers, student acceptance and placement. Profile holds academic details, preferences, optional CV/calendar, verification and agent controls.

Onboarding collects name/email, university, degree, graduation year, academic status, emirate, skills, preferred work types/hours and eligibility declarations. Adult/data consent is explicit; matching consent is separate/optional. Progress can be saved. Calendar/CV remain optional. Self-declarations are not a permit or identity approval; minors are outside this release.

Employers save business information and submit commercial registration, operating licence and representative ID. Admins review documents and issue a final account decision. New jobs specify AED pay/period, UAE location/remote, dates, working hours, qualifications, skills, positions and deadline. Only trusted reviewer-backed verified businesses publish.

## Hiring state machine

`applied → shortlisted → interview → offered → accepted → placed → completed`.

Employers can skip optional shortlist/interview stages and reject within allowed states. Students alone accept offers or withdraw within supported states. The owning employer confirms placement. RPCs enforce ownership, current eligibility, expiry, duplicate protection and transition rules; notifications/audit records are transactional. This coordinates recruitment; it is not an automatically executed employment contract.

## Availability

Students choose weekly preferred work windows, IANA timezone, minimum shift length and travel buffer. Empty calendar time never implies willingness to work. Manual busy periods and bounded ICS imports are supported. Imports replace only the caller's previous imported timetable atomically, preserve manual entries, discard event descriptions/titles and can be disconnected/deleted.

Recurrences, exclusions/overrides, all-day exams and timezone/DST changes are tested. File import is a snapshot over the next 120 days; re-import after timetable changes. Fixed shifts and their travel buffer must stay within that coverage, otherwise fit is unconfirmed and submission is blocked. Flexible multi-week jobs require agreement on actual hours. Explicit calendar downloads use stable identifiers for confirmed interviews/placed fixed shifts.

Direct Google/Microsoft OAuth synchronization awaits registered credentials, state/PKCE, encrypted backend token custody, scopes and consent testing. Provider adapters are prepared with minimal read-only access. No employer receives calendar events or provider tokens. Write scopes require separate explicit permission.

## Agent modes

1. Recommendations: eligible internal opportunities and explanations, manual application.
2. Approval (default): truthful drafts and individual student approval before submission.
3. Automatic: disabled behind server/UI gates until constraints and explicit authorization are verified. No external job-board submission integration is assumed.

Hard constraints cover adult/eligibility and matching declarations, open/unexpired jobs, requirements, salary/location/exclusions, timetable fit, duplicate prevention and atomic limits. Scores cannot override them. Pause/disable persists immediately. Paid models remain disabled by default; deterministic templates never fabricate qualifications.

## Deferred and external decisions

Keep/repair core hiring, verification, CV, notifications, EN/AR and availability. Isolate historical financial/attendance/event/freelance/advanced-intelligence modules behind default-off flags. Future TAAWUN Experience should use separate programme/cohort/mentor/learning-outcome modules after the marketplace works. No corporate partnership is confirmed.

Counsel/business approval must establish operating licence/model, permit responsibilities, privacy notices/lawful processing/cross-border transfers, retention/deletion, adult-only safeguards, incident response and support. The 18+ cohort is a product decision, not a claim about all statutory UAE student permit ages.

Official references reviewed 2026-10-15: [MOHRE permit regulations](https://www.mohre.gov.ae/assets/download/b0209e61/Cabinet%20Resolution%20_Executive%20Regulations%20Decree-Law%20No.%2033.pdf.aspx), [UAE data protection overview](https://u.ae/en/about-the-uae/digital-uae/data/data-protection-laws.), [Personal Data Protection Law](https://www.uaelegislation.gov.ae/en/legislations/1972/download). These support questions for professional review, not legal approval of TAAWUN.
