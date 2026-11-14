import { CreateBookingInput, CreateEventInput } from '../api/types';

export interface Customer {
  name: string;
  email: string;
  phone: string;
}

const unique = () => Math.random().toString(36).slice(2, 8);

/** A valid customer; unique per call so parallel tests can tell their data apart. */
export function aCustomer(overrides: Partial<Customer> = {}): Customer {
  const id = unique();
  return {
    name: `QA Auto ${id}`,
    email: `qa.auto.${id}@example.com`,
    phone: '+91-9876543210',
    ...overrides,
  };
}

export function aBookingRequest(eventId: number, overrides: Partial<CreateBookingInput> = {}): CreateBookingInput {
  const customer = aCustomer();
  return {
    eventId,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    quantity: 1,
    ...overrides,
  };
}

/**
 * A valid event. Every test creates its own private event, so seat counts are
 * never touched by another test — that is what makes the suite safe to run in parallel.
 */
export function anEvent(overrides: Partial<CreateEventInput> = {}): CreateEventInput {
  return {
    title: `QA Event ${unique()}`,
    description: 'Created by automated tests. Safe to delete.',
    category: 'Workshop',
    venue: 'Automation Hall',
    city: 'Pune',
    eventDate: '2027-06-15T09:00:00.000Z',
    price: 250,
    totalSeats: 50,
    ...overrides,
  };
}

/** Credentials for a throwaway account (used by the "newly registered user" tests). */
export function newUserCredentials() {
  return { email: `qa.new.${Date.now()}.${unique()}@example.com`, password: `Qa!${unique()}${unique()}A9` };
}

/** The UI shows prices as "$1,500". */
export function formatPrice(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}

/** Business limits observed in the app (not stated in the story). */
export const TICKET_LIMITS = { min: 1, max: 10 } as const;

/** Title prefixes of events created by the suite; the final cleanup deletes anything matching. */
export const TEST_EVENT_TITLE_PREFIXES = ['QA Event ', 'QA Foreign ', 'Visual TC-'] as const;
