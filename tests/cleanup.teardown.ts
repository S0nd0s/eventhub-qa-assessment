import fs from 'node:fs';
import { test as teardown, request as playwrightRequest } from '@playwright/test';
import { env, authFiles, UserRole } from '../src/config/env';
import { EventsApi } from '../src/api/events.api';
import { TEST_EVENT_TITLE_PREFIXES } from '../src/data/booking.factory';

/**
 * Safety net that runs once after all tests.
 * Every test already deletes its own event, but a run that is interrupted (crash, timeout,
 * server outage) can leave one behind. This removes any event created by the suite,
 * and with it the event's bookings.
 *
 * Note: it deletes by title prefix, so two runs sharing the same accounts at the same time
 * would interfere. Use separate accounts for concurrent pipelines.
 */
const roles: UserRole[] = ['primary', 'secondary'];

for (const role of roles) {
  teardown(`remove leftover test events of the ${role} user`, async () => {
    const { token } = JSON.parse(fs.readFileSync(authFiles.token(role), 'utf8'));
    const context = await playwrightRequest.newContext({
      baseURL: env.apiUrl,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    });
    const eventsApi = new EventsApi(context);

    const leftovers = (await eventsApi.listAll()).filter(
      (event) => !event.isStatic && TEST_EVENT_TITLE_PREFIXES.some((prefix) => event.title.startsWith(prefix)),
    );
    for (const event of leftovers) await eventsApi.delete(event.id);

    await context.dispose();
  });
}
