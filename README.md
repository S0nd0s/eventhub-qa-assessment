# EventHub — booking flow test automation

> **Expect 2 failing tests. They are real bugs in the application, not broken tests.**
> **`GET /bookings/abc` and `DELETE /bookings/abc` return `500 Internal server error` instead of `400`/`404`.**
> **The tests `TC-API-GET-02` and `TC-API-CANCEL-03` ("BUG: …" in the report) fail on purpose, so the run and the CI pipeline stay red until the defect is fixed. Every other test passes.**

UI, end-to-end and API tests for **Book tickets for an event**, written with Playwright and TypeScript.

- Web app: https://eventhub.rahulshettyacademy.com
- API docs: https://api.eventhub.rahulshettyacademy.com/api/docs

## How to run

Requires Node 22 or newer.

```bash
npm ci
npx playwright install chromium
cp .env.example .env        # then fill in two accounts (see below)
npx playwright test         # everything
npm run test:e2e            # browser tests: main, edge and error scenarios
npm run test:api            # API tests only
npm run test:visual         # screenshot comparison
npm run report              # open the HTML report of the last run
```

The suite needs **two accounts** in `.env`: a primary user who does the booking, and a secondary user who plays "another user". An account that does not exist yet is registered automatically on the first run.

## 1. Story review

Everything below was observed against the live environment on 13–14 Nov 2026.

**The four points I would raise first**

1. **Refunds and payment.** The application has a refund rule, but the story never mentions refunds, and there is no payment step anywhere. What does "refund" mean here?
2. **"Cancelled" does not exist.** The API documents a `cancelled` status, but cancelling deletes the booking.
3. **My Bookings shows only the 10 newest bookings**, with no way to page.
4. **`GET` and `DELETE /bookings/abc` crash with a 500.**

### 1.1 Application defects (D)

| # | What happens | How I saw it | Why it matters |
|---|---|---|---|
| D1 | A non-numeric booking id returns `500 Internal server error`. | `GET` and `DELETE /bookings/abc`. An unknown number such as `99999999` correctly returns `404`. | A crash on bad input. Two tests fail on purpose because of it (see section 2). |
| D2 | My Bookings lists only the 10 newest bookings and has no paging controls. | The page requests `page=1&limit=10`; there are no paging buttons. | A user with more than 10 bookings cannot reach the older ones from the list. |
| D3 | After confirming a booking, the "Available" seats figure on the event page does not change until the page is reloaded. | Seen twice. The API value is correct. | Stale information on screen. |


### 1.2 API versus documentation (A)

| # | Documentation says | What the API does | Why it matters |
|---|---|---|---|
| A1 | The booking and event endpoints declare no security. Story: "As a **visitor**". | The site redirects to `/login`, and every booking and event call returns `401 Unauthorized` without a Bearer token. | Either the story means "registered user", or anonymous booking is missing. | 
| A2 | A booking has status `confirmed` or `cancelled`, and the list can be filtered by `status=cancelled`. | Cancelling deletes the booking: `GET /bookings/{id}` then returns `404`, and the `cancelled` filter returns nothing. The documentation of `DELETE` itself says "permanently deletes", so the docs contradict themselves. | "Cancelled" is a state that cannot exist. No cancellation history for the user or for support. |
| A3 | Nothing about refunds or payment. | The booking details page has a refund check: a 1-ticket booking is "eligible", a booking of 2 or more tickets is "non-refundable". "Total Paid" is shown although no payment happens. | A business rule that exists only in the UI and is undocumented. |


### 1.3 Design and UI (U)

| # | Observation |
|---|---|
| U1 | The cancel pop-up wording differs by place. My Bookings: "This will cancel Q-… and release 4 seat(s) back to the event. This action cannot be undone." Booking details: "Cancelling Q-… will release 2 seat(s) back to the event. This cannot be undone." |
| U2 | The load-error copy differs: "There was a problem connecting to the server. Please try again." (events) versus "Failed to connect to the server. Please try again." (bookings). |
| U3 | Users see technical text in error pop-ups: "Internal server error" and "Network Error". |
| U4 | Prices are shown in **$** for events in Indian cities, while the phone placeholder is `+91`. |
| U5 | The phone error says "Enter a valid 10-digit phone", but the placeholder (`+91 98765 43210`) and formats with a country code are accepted. |
| U6 | Event times are shown in the viewer's time zone with no label (a stored 09:00 UTC appears as "12:00 pm"). |
| U7 | The "per ticket" label sits under the "Book Tickets" heading on the left, away from the price on the right. I would put it directly below the price, or beside it. |
| U8 | The refund result is shown only on the booking details page. The cancel pop-up says nothing about refunds, so a user can cancel a non-refundable booking without being told. |
| U9 | Validation runs only when Confirm Booking is clicked. The button is always enabled, errors appear after the click and stay until the next click. |



### 1.4 What is missing or unclear in the story

- **AC1 — no validation rules.** Which fields are required, and what is a valid name, email or phone? The API requires a name of 2+ characters, a valid email and a phone of 10+ digits. The story says none of this, and nothing says when validation should run.
- **AC1 — no ticket limits.** The application allows 1 to 10 tickets per booking. The story does not mention a limit.
- **AC1 — no unhappy paths.** What happens when fewer seats are left than requested, or the event is sold out?
- **AC1 — no terms and conditions, payment or user country.** Nothing is said about terms at booking, about how the booking is paid, or about whether the user's country changes anything (currency, phone format, tax, availability).
- **AC1 — "booking is created" is the only lifecycle.** There is no mention of other statuses (pending, paid, fulfilled), of an organiser or vendor, or of a confirmation email.
- **AC2 — price details.** Currency, rounding, fees, taxes or discounts are not mentioned. Is "price × quantity" really the whole formula?
- **AC3 — what the list shows.** Which details appear, in what order, whose bookings, and how many per page?
- **AC4 — "cancel" is undefined.** Is there a confirmation step? A cut-off before the event? A refund? Are the seats released? Does the booking disappear or remain as "cancelled"?
- **AC5 — "the same works" is not testable as written.** Does it cover only creating a booking, or viewing and cancelling too? Which status codes and error formats are expected? Is authentication required?
- **No design reference.** There is no Figma file or other design reference, so I cannot say whether the UI is right, only whether it changed.
- **Error messages and pop-ups are not specified.** There is no approved wording, duration or behaviour for errors.
- **Not mentioned at all:** booking the same event more than once, two people booking the last seats at the same moment, error handling when the server is unavailable.

### 1.5 Questions

**For the Product Owner**

*Booking rules*

1. Must a user be logged in to book? If yes, should the story say "registered user"?
2. Is the 1–10 ticket limit a business rule?
3. If a user books the same event several times, should each booking be a separate entry (as now) or be merged?
4. When should validation run: only on Confirm (as now), while typing, or with the button disabled until the form is valid?
5. What are the exact rules for name, email (is `user@domain` valid?) and phone: exactly 10 digits? Is a country code required or validated? Must the number belong to the same country as the event? Is the phone mandatory?
6. Does the user's country matter (currency, phone format, tax, which events are offered)?
7. What currency are prices in? Are there fees, taxes or rounding rules?

*Payment and refunds*


8. What is the refund policy? Today only a single-ticket booking is refundable. Is that intended, and what does "refund" do? Because eligibility depends on the tickets in one booking, booking 1 ticket five times makes each booking refundable, while one booking of 5 tickets is not. Is that acceptable?
9. Should the user be told before cancelling that a booking is not refundable?

*Cancellation and lifecycle*

10. Should a cancelled booking stay visible with a "cancelled" status, or be removed (as now)?
11. Is there a cancellation deadline before the event?
12. Is "confirmed" the only status? Are there others (pending, paid, fulfilled), an organiser or vendor involved, or a confirmation email or notification?
13. Should the user accept terms and conditions when booking?


*Errors and data*

14. What should the user see when there are not enough seats, when the server is unavailable, or when the session expires during booking? Who defines the wording?
15. After a network or server error, should the form keep what the user typed (as now) or ask them to retype it? And after session expiry?
16. Which bookings does My Bookings show, in what order, and how are more than 10 reached?
17. What is the intended booking reference format?

**For design**

1. Is there a design (Figma or spec) for the sold-out, empty and error states, the pop-ups and the toasts, with approved error copy?
2. How long should an error pop-up stay? It closes by itself after a few seconds.
3. Which time zone, currency symbol and page titles should be shown?
4. Where should "per ticket" go: below the price or beside it?
5. Which accessibility standard applies, and are other languages or locales required?


## 2. Scope and approach

- **Scope: booking and cancelling only**, as the brief asks. Browsing events, event management (the Admin menu), registration and login are not tested. Login and registration are used only to set up the test users.
- **I did not assume what is missing or unclear.** Where the story says nothing or is ambiguous, I wrote no test cases for that area and listed it as a question in section 1. Examples: booking the same event repeatedly, a cancellation deadline, past events, payment, confirmation emails. Where the application implements a rule the story does not state (1–10 tickets, refund eligibility, phone digits), the tests assert what it does today, and the README marks the rule as unconfirmed.
- **Error messages are not specified**, so the tests check that the user is told an error happened and that nothing was booked. They compare the text only where the API itself returns it (for example "Only 0 seat(s) available, but 1 requested") or the generic "Network Error". They do not judge wording or design.
- **There is no design reference**, so the visual baselines are taken from the current application. They detect change, not correctness.
- **Real bugs fail the run.** A test that finds a confirmed defect asserts the correct behaviour and is left failing, with a `bug` annotation in the report that describes the defect. It shows red on every run until the defect is fixed. Currently 2 tests fail for this reason (D1).
- **Two workers are configured to show that the suite can run in parallel.** It does not need them for speed. Each test owns its event, so the number can be changed in `playwright.config.ts`. A very high number could hit the 10-booking window of My Bookings (D2).

## 3. Key decisions

**Playwright + TypeScript for UI, API and visual tests.** One language, one runner, one report. The API clients that test the API are also used by browser tests to prepare and clean up data.

**Authorization lives in the framework.** `tests/auth.setup.ts` logs both users in once per run through the API and saves their sessions. Browser tests start already logged in, and API tests receive a client that already carries the token (`src/fixtures`). No test contains a login step or a credential. A test that needs to be someone else asks for it by name: `otherUserApi`, `anonymousApi`, `newUser`.

**Layers, so the suite can grow.**

```
src/config     environment and credentials — the only place that reads .env
src/api        one small client per API resource
src/pages      one page object per screen, plus shared components (toast, cancel pop-up)
src/flows      steps reused by several test cases (book through the UI, simulate a failure)
src/assertions shared checks: order summary, confirmation, booking card, booking details
src/data       test data builders
src/fixtures   wires all of the above into the tests
tests/e2e      browser tests: main/, edge/, errors/
tests/api      API tests: list/, create/, ref/, get/, cancel/
tests/visual   screenshot tests and their baselines
```

**One file per test case, named by its ID** (`TC-E2E-02.cancel-refundable-booking.spec.ts`). A failing test in the report points straight at one file and one row of the tables in section 4.

**Every test creates its own event.** The `createEvent` fixture creates an event private to the user and deletes it when the test ends, pass or fail. Deleting an event deletes its bookings too, so this one step is the complete teardown. Because no two tests share an event, seat counts are exact and the suite is safe to run in parallel.

**Test cases do not depend on each other.** Where a scenario builds on another ("cancel a booking" needs a booking), the precondition is created through the API or through a shared step in `src/flows`, not by running another test first. Any single file can be run alone. The only dependency in the suite is that every project waits for the `setup` project (login).

**Arrange through the API, assert through the UI.** A test about cancelling does not need to click through the booking form first. This keeps browser tests short and limits what can break them.

**Error scenarios are simulated in the browser.** `simulateFailure` makes one API call answer with a server error or drop the connection, so the test can check what the user sees. Where the real backend can produce the error (last seat taken, not found, another user's data), no simulation is used.


### Visual testing

The screens themselves are the reference: `toHaveScreenshot` compares each key state of the flow with a committed baseline image and fails on a visible difference.

- Data is fixed (event title, price, customer) so the picture is the same every run.
- Values that cannot be fixed (booking reference, booking id, booking date) are masked.
- Screenshots cover the page content or one component, not the whole window.
- Up to 1% differing pixels is tolerated, to absorb anti-aliasing noise.
- After an intended design change, review and accept new baselines with `npm run test:visual:update`.

Baselines depend on the operating system's font rendering, so there is one set per platform. The Windows set is committed. The Linux set, which the CI pipeline needs, is generated by a manual workflow: **Actions > "visual baselines (linux)" > Run workflow**. It takes the screenshots on Linux and commits them. Until that has been run once, the pipeline skips the visual tests; afterwards it runs them automatically.

## 4. Test cases and traceability

AC6–AC9 below are not in the story. They are the rules the story leaves out and the application implements; I numbered them so every test case traces to something.

| AC | Meaning |
|---|---|
| AC1 | Choose tickets, enter name, email and phone, confirm: booking is created with a reference |
| AC2 | Total = ticket price × number of tickets |
| AC3 | The booking appears in My Bookings |
| AC4 | A booking can be cancelled |
| AC5 | The same works through the API |
| AC6 (implied) | Input rules: mandatory fields, valid values, 1–10 tickets |
| AC7 (implied) | Seat availability: sold out, limited seats, seats released on cancel |
| AC8 (implied) | Access: login required, users see only their own data |
| AC9 (implied) | Failures are reported to the user |

### A. Visual (`tests/visual`)

| TC | Scenario | AC |
|---|---|---|
| TC-VIS-01 | Event page with the empty booking form | AC1 |
| TC-VIS-02 | Booking form showing validation errors | AC6 |
| TC-VIS-03 | Booking confirmation | AC1, AC2 |
| TC-VIS-04 | Booking card in My Bookings | AC3 |
| TC-VIS-05 | Booking details page with refund result | AC3 |
| TC-VIS-06 | Cancel confirmation pop-up | AC4 |
| TC-VIS-07 | Sold-out event page | AC7 |
| TC-VIS-08 | My Bookings: empty state and load-error state | AC3, AC9 |

### B1. End-to-end, main scenarios (`tests/e2e/main`)

| TC | Scenario | AC |
|---|---|---|
| TC-E2E-01 | Book the minimum (1 ticket); check every element on the event page, confirmation, My Bookings card and details page | AC1, AC2, AC3 |
| TC-E2E-02 | Refundable booking (1 ticket): refund check "eligible"; cancel from the **details page** — pop-up names the booking reference and the 1 seat released; "×" keeps the booking; confirm returns to My Bookings with a success message; seat returned | AC4, AC7 |
| TC-E2E-03 | Non-refundable booking (3 tickets): refund check "not eligible"; cancel from **My Bookings** — pop-up names the booking reference and the 3 seats released; "Cancel" keeps the booking; confirm removes the card with a success message; seats returned | AC4, AC7 |
| TC-E2E-04 | Book three events, verify each card, cancel them one by one | AC1, AC3, AC4 |
| TC-E2E-05 | Newly registered user: empty My Bookings, then books | AC1, AC3 |

### B2. Edge cases (`tests/e2e/edge`)

| TC | Scenario | AC |
|---|---|---|
| TC-EDGE-01 | Sold-out event: counter and submit button disabled, nothing sent | AC7 |
| TC-EDGE-02 | Mandatory fields: empty form, and each field missing on its own | AC6 |
| TC-EDGE-03 | Invalid values per field, with the right message | AC6 |
| TC-EDGE-04 | Ticket counter stays within 1–10; total follows | AC2, AC6 |
| TC-EDGE-05 | Counter capped by remaining seats | AC7 |
| TC-EDGE-06 | Book the maximum (10 tickets): event becomes sold out, further bookings are blocked, another user cannot book it | AC1, AC7, AC8 |
| TC-EDGE-07 | N seats of a sold-out event are released: at most N can be booked again | AC7 |
| TC-EDGE-08 | Last seat taken while the form is open | AC7, AC9 |
| TC-EDGE-09 | Slow connection: button locked, only one booking made | AC9 |

### B3. Error scenarios (`tests/e2e/errors`)

| TC | Scenario | AC |
|---|---|---|
| TC-ERR-01 | Server error while booking: message, form data kept, retry works | AC9 |
| TC-ERR-02 | Network failure while booking: message, nothing booked | AC9 |
| TC-ERR-03 | Session expires while booking: sent to login | AC8 |
| TC-ERR-04 | Events list fails to load: error and Retry | AC9 |
| TC-ERR-05 | My Bookings fails to load: error and Retry | AC9 |
| TC-ERR-06 | Cancelling fails: message, booking stays | AC4, AC9 |
| TC-ERR-07 | Booking cannot be shown (unknown id, cancelled, another user's booking): clear message, and the "View My Bookings" button is labelled correctly, points to the list and leads to it | AC8, AC9 |

### C. API (`tests/api`) — all trace to AC5

| TC | Endpoint | Scenario | Also |
|---|---|---|---|
| TC-API-LIST-01 | `GET /bookings` | New user: empty list | AC3 |
| TC-API-LIST-02 | | No token / invalid token: 401 | AC8 |
| TC-API-LIST-03 | | Filter by event id | AC3 |
| TC-API-LIST-04 | | Cancelled bookings (removed, `status=cancelled` empty) | AC4 |
| TC-API-LIST-05 | | Confirmed bookings | AC3 |
| TC-API-LIST-06 | | All bookings, newest first, with event; other users' excluded | AC3, AC8 |
| TC-API-LIST-07 | | Page and limit calculations | AC3 |
| TC-API-CREATE-01 | `POST /bookings` | Event does not exist, was deleted, or belongs to another user | AC8 |
| TC-API-CREATE-02 | | Fully booked, not enough seats, race for the last seat | AC7 |
| TC-API-CREATE-03 | | Maximum quantity (10) | AC1, AC2 |
| TC-API-CREATE-04 | | Minimum quantity (1), full response | AC1, AC2 |
| TC-API-CREATE-05 | | Quantity outside 1–10 | AC6 |
| TC-API-CREATE-06 | | Field validation | AC6 |
| TC-API-CREATE-07 | | No token: 401 | AC8 |
| TC-API-REF-01 | `GET /bookings/ref/{ref}` | Existing reference (also case-insensitive) | AC3 |
| TC-API-REF-02 | | Unknown or cancelled reference: 404 | AC4 |
| TC-API-REF-03 | | Another user: 403. No token: 401 | AC8 |
| TC-API-GET-01 | `GET /bookings/{id}` | Existing booking | AC3 |
| TC-API-GET-02 | | Unknown, cancelled, non-numeric id | AC4 |
| TC-API-GET-03 | | Another user: 403. No token: 401 | AC8 |
| TC-API-CANCEL-01 | `DELETE /bookings/{id}` | Existing booking: removed, seats returned | AC4, AC7 |
| TC-API-CANCEL-02 | | Already cancelled: 404, seats not added twice | AC4, AC7 |
| TC-API-CANCEL-03 | | Id that was never a booking, non-numeric id | AC4 |
| TC-API-CANCEL-04 | | Another user: 404. No token: 401 | AC8 |


## 5. Continuous integration

`.github/workflows/tests.yml` runs the type check and the e2e and API tests on every push, plus the visual tests once Linux baselines exist, and uploads the HTML report. `.github/workflows/visual-baselines.yml` generates those baselines on request. Both need four repository secrets: `EVENTHUB_EMAIL`, `EVENTHUB_PASSWORD`, `EVENTHUB_EMAIL_2`, `EVENTHUB_PASSWORD_2`.

## 6. With more time

- **Tests for the issues I noticed in the application** (section 1): one test per defect, UI and design inconsistency, tagged as a bug. Today only D1 has one.
- **Full API schema validation** of every response against the OpenAPI document, field by field and type by type. A snapshot is in `docs/`; this would automatically catch differences between the documentation and the real responses, such as changed field types or undocumented fields.
- **Video of every run**, published with the reports to cloud storage, so a failure can be watched without re-running it.
- **Account creation and test data management.** I did not have much time to think this through. It is simple and works for this size, but it needs more thought for more data and more test cases: accounts cannot be deleted and pile up, the final cleanup deletes by title prefix and assumes one run per pair of accounts, parallel tests share two accounts, and My Bookings shows only the newest 10 (D2). Options are one account per worker, run-specific names, and a proper test-data service.
- **More paging validation.** My Bookings paging (D2) and the events list paging, with boundary pages and large data sets. I did not have time to cover it properly.
- **Cross-browser** (Firefox, WebKit) and **cross-device** testing (phone and tablet sizes).
- **Localisation and accessibility:** keyboard use, screen readers, contrast, error pop-ups that disappear on their own, other languages and locales.

