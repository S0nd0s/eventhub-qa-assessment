/**
 * The shared server occasionally drops a connection (ECONNRESET). How each kind of request copes:
 *
 * 1. Requests that change nothing (GET, login): retried automatically, up to RETRIES times.
 *    Playwright retries network-level failures only, never an HTTP error response,
 *    so a retry cannot hide a real bug.
 *
 * 2. Creating and deleting TEST EVENTS (a precondition / teardown, not the thing under test):
 *    retried, but only after checking whether the lost request already did its work
 *    (see EventsApi.create and EventsApi.delete). If all attempts fail, the error says
 *    "PRECONDITION FAILED" or "TEARDOWN FAILED" so the report does not blame the scenario.
 *
 * 3. Bookings (create, cancel) and register: never retried. They are what the tests verify;
 *    repeating one could create a duplicate booking. They fail visibly instead.
 */
export const RETRIES = 2;
