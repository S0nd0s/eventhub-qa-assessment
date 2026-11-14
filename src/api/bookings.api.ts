import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { BookingDto, CreateBookingInput } from './types';
import { RETRIES } from './retry';

/**
 * Thin client for /bookings.
 * "Raw" methods return the APIResponse so tests can assert on status codes (negative cases);
 * the plain helpers are for arranging data and fail loudly if the call does not succeed.
 */
export class BookingsApi {
  constructor(private readonly request: APIRequestContext) {}

  createRaw(input: Record<string, unknown>): Promise<APIResponse> {
    return this.request.post('bookings', { data: input });
  }

  listRaw(params: Record<string, string | number> = {}): Promise<APIResponse> {
    return this.request.get('bookings', { params, maxRetries: RETRIES });
  }

  getByIdRaw(id: number | string): Promise<APIResponse> {
    return this.request.get(`bookings/${id}`, { maxRetries: RETRIES });
  }

  getByRefRaw(ref: string): Promise<APIResponse> {
    return this.request.get(`bookings/ref/${ref}`, { maxRetries: RETRIES });
  }

  cancelRaw(id: number | string): Promise<APIResponse> {
    return this.request.delete(`bookings/${id}`);
  }

  async create(input: CreateBookingInput): Promise<BookingDto> {
    const response = await this.createRaw({ ...input });
    expect(response.status(), `create booking failed: ${await response.text()}`).toBe(201);
    return (await response.json()).data;
  }

  async cancel(id: number): Promise<void> {
    const response = await this.cancelRaw(id);
    expect(response.status(), `cancel booking ${id} failed: ${await response.text()}`).toBe(200);
  }
}
