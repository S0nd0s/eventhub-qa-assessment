import fs from 'node:fs';
import { test as base, APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { env, authFiles, storageStateFor, Credentials, UserRole } from '../config/env';
import { AuthApi } from '../api/auth.api';
import { BookingsApi } from '../api/bookings.api';
import { EventsApi } from '../api/events.api';
import { CreateEventInput, EventDto } from '../api/types';
import { anEvent, newUserCredentials } from '../data/booking.factory';
import { EventDetailPage } from '../pages/event-detail.page';
import { EventsPage } from '../pages/events.page';
import { MyBookingsPage } from '../pages/my-bookings.page';
import { BookingDetailPage } from '../pages/booking-detail.page';

type CreateEvent = (overrides?: Partial<CreateEventInput>) => Promise<EventDto>;

/** A brand-new account registered for one test. */
export interface NewUser {
  credentials: Credentials;
  bookingsApi: BookingsApi;
  eventsApi: EventsApi;
  createEvent: CreateEvent;
  /** Pass to browser.newContext() to open a browser already logged in as the new user. */
  storageState: ReturnType<typeof storageStateFor>;
}

type Options = {
  /** Which permanent account the test acts as. Set per project in playwright.config.ts. */
  userRole: UserRole;
};

type Fixtures = {
  /** HTTP context that already sends the acting user's Bearer token. */
  api: APIRequestContext;
  /** HTTP context authenticated as the OTHER permanent user — for ownership / isolation tests. */
  otherUserApi: APIRequestContext;
  /** HTTP context with NO token — for "must be rejected" tests. */
  anonymousApi: APIRequestContext;
  bookingsApi: BookingsApi;
  eventsApi: EventsApi;
  otherUserBookingsApi: BookingsApi;
  otherUserEventsApi: EventsApi;
  /**
   * Creates an event private to the acting user and deletes it after the test, pass or fail.
   * Deleting an event also deletes its bookings (cascade), so this is the teardown for everything
   * a test creates. Each test gets its own event, so tests never share seat counts.
   */
  createEvent: CreateEvent;
  newUser: NewUser;
  eventsPage: EventsPage;
  eventDetailPage: EventDetailPage;
  myBookingsPage: MyBookingsPage;
  bookingDetailPage: BookingDetailPage;
};

const readToken = (role: UserRole): string => JSON.parse(fs.readFileSync(authFiles.token(role), 'utf8')).token;

const authorizedContext = (token: string) =>
  playwrightRequest.newContext({ baseURL: env.apiUrl, extraHTTPHeaders: { Authorization: `Bearer ${token}` } });

/** Builds a createEvent function that remembers what it created, plus the matching teardown. */
function eventCreator(eventsApi: EventsApi) {
  const ids: number[] = [];
  const create: CreateEvent = async (overrides = {}) => {
    const event = await eventsApi.create(anEvent(overrides));
    ids.push(event.id);
    return event;
  };
  const teardown = async () => {
    for (const id of ids) await eventsApi.delete(id);
  };
  return { create, teardown };
}

/**
 * Every test imports `test` from here, not from @playwright/test.
 * This is the single place where authorization, clients, page objects and cleanup are wired.
 */
export const test = base.extend<Fixtures & Options>({
  userRole: ['primary', { option: true }],

  api: async ({ userRole }, use) => {
    const context = await authorizedContext(readToken(userRole));
    await use(context);
    await context.dispose();
  },

  otherUserApi: async ({ userRole }, use) => {
    const context = await authorizedContext(readToken(userRole === 'primary' ? 'secondary' : 'primary'));
    await use(context);
    await context.dispose();
  },

  anonymousApi: async ({}, use) => {
    const context = await playwrightRequest.newContext({ baseURL: env.apiUrl });
    await use(context);
    await context.dispose();
  },

  bookingsApi: async ({ api }, use) => use(new BookingsApi(api)),
  eventsApi: async ({ api }, use) => use(new EventsApi(api)),
  otherUserBookingsApi: async ({ otherUserApi }, use) => use(new BookingsApi(otherUserApi)),
  otherUserEventsApi: async ({ otherUserApi }, use) => use(new EventsApi(otherUserApi)),

  createEvent: async ({ eventsApi }, use) => {
    const { create, teardown } = eventCreator(eventsApi);
    await use(create);
    await teardown();
  },

  newUser: async ({ anonymousApi }, use) => {
    const credentials = newUserCredentials();
    const token = await new AuthApi(anonymousApi).register(credentials);
    const context = await authorizedContext(token);
    const eventsApi = new EventsApi(context);
    const { create, teardown } = eventCreator(eventsApi);

    await use({
      credentials,
      bookingsApi: new BookingsApi(context),
      eventsApi,
      createEvent: create,
      storageState: storageStateFor(token),
    });

    // The API has no "delete account" endpoint, so the account itself stays; its data is removed.
    await teardown();
    await context.dispose();
  },

  eventsPage: async ({ page }, use) => use(new EventsPage(page)),
  eventDetailPage: async ({ page }, use) => use(new EventDetailPage(page)),
  myBookingsPage: async ({ page }, use) => use(new MyBookingsPage(page)),
  bookingDetailPage: async ({ page }, use) => use(new BookingDetailPage(page)),
});

export { expect } from '@playwright/test';
