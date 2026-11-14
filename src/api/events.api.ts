import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { CreateEventInput, EventDto } from './types';
import { RETRIES } from './retry';

/** How many times creating or deleting a test event is attempted when the connection drops. */
const EVENT_ATTEMPTS = 3;

const reason = (error: unknown) => (error instanceof Error ? error.message.split('\n')[0] : String(error));

export class EventsApi {
  constructor(private readonly request: APIRequestContext) {}

  getByIdRaw(id: number): Promise<APIResponse> {
    return this.request.get(`events/${id}`, { maxRetries: RETRIES });
  }

  /** One delete request, no retry. For tests that assert on the response itself. */
  deleteRaw(id: number): Promise<APIResponse> {
    return this.request.delete(`events/${id}`);
  }

  async getById(id: number): Promise<EventDto> {
    const response = await this.getByIdRaw(id);
    expect(response.status(), `get event ${id} failed`).toBe(200);
    return (await response.json()).data;
  }

  /** All events visible to the user (featured ones and their own). */
  async listAll(): Promise<EventDto[]> {
    const response = await this.request.get('events', { params: { limit: 100 }, maxRetries: RETRIES });
    expect(response.status(), 'list events failed').toBe(200);
    return (await response.json()).data;
  }

  async availableSeats(id: number): Promise<number> {
    return (await this.getById(id)).availableSeats;
  }

  /**
   * Creates an event that is private to the calling user (a test precondition).
   *
   * If the connection drops, the request is NOT blindly repeated: the server may have created
   * the event before the reply was lost. So before each new attempt we look for an event with
   * this title (titles are unique per test) and reuse it if it exists.
   *
   * After the last attempt the test fails with a message that says the PRECONDITION failed,
   * so the report does not blame the scenario under test.
   */
  async create(input: CreateEventInput): Promise<EventDto> {
    let lastError = '';
    for (let attempt = 1; attempt <= EVENT_ATTEMPTS; attempt++) {
      let response: APIResponse;
      try {
        response = await this.request.post('events', { data: input });
      } catch (error) {
        lastError = reason(error);
        console.warn(`[precondition] create event "${input.title}": attempt ${attempt}/${EVENT_ATTEMPTS} lost the connection (${lastError})`);
        const existing = await this.findByTitle(input.title);
        if (existing) {
          console.warn(`[precondition] event "${input.title}" was created by the lost request (id ${existing.id}); using it, no retry needed`);
          return existing;
        }
        continue;
      }
      // The server answered: an error status here is a real answer and is never retried.
      expect(response.status(), `PRECONDITION FAILED: create event "${input.title}" was rejected: ${await response.text()}`).toBe(201);
      return (await response.json()).data;
    }
    throw new Error(
      `PRECONDITION FAILED: the test event "${input.title}" could not be created after ${EVENT_ATTEMPTS} attempts ` +
        `because the connection to the server kept dropping (last error: ${lastError}). ` +
        `This is a test-setup problem, not a failure of the scenario under test.`,
    );
  }

  /**
   * Deletes a test event (teardown). Deleting an event also deletes its bookings.
   *
   * If the connection drops, we first check whether the event is already gone before trying
   * again. "Already gone" (404) counts as success. After the last attempt the failure is
   * reported as a TEARDOWN failure and names the event that was left behind.
   */
  async delete(id: number): Promise<void> {
    let lastError = '';
    for (let attempt = 1; attempt <= EVENT_ATTEMPTS; attempt++) {
      let response: APIResponse;
      try {
        response = await this.request.delete(`events/${id}`);
      } catch (error) {
        lastError = reason(error);
        console.warn(`[teardown] delete event ${id}: attempt ${attempt}/${EVENT_ATTEMPTS} lost the connection (${lastError})`);
        if (await this.isGone(id)) {
          console.warn(`[teardown] event ${id} was deleted by the lost request; no retry needed`);
          return;
        }
        continue;
      }
      expect([200, 404], `TEARDOWN FAILED: delete event ${id} was rejected: ${await response.text()}`).toContain(response.status());
      return;
    }
    throw new Error(
      `TEARDOWN FAILED: test event ${id} could not be deleted after ${EVENT_ATTEMPTS} attempts ` +
        `because the connection to the server kept dropping (last error: ${lastError}). ` +
        `The event is left behind; the final cleanup step of the next run will remove it.`,
    );
  }

  /** Looks for an event by title; undefined when it does not exist or the check itself fails. */
  private async findByTitle(title: string): Promise<EventDto | undefined> {
    try {
      return (await this.listAll()).find((event) => event.title === title);
    } catch {
      return undefined; // could not check — the caller will try the request again
    }
  }

  private async isGone(id: number): Promise<boolean> {
    try {
      return (await this.getByIdRaw(id)).status() === 404;
    } catch {
      return false; // could not check — the caller will try the request again
    }
  }
}
