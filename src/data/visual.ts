import { Customer } from './booking.factory';

/**
 * Fixed data for screenshot tests: a baseline only stays comparable if the page shows
 * the same text every run. Each visual test case uses its own fixed event title.
 * Values that cannot be fixed (booking reference, booking id, booking date) are masked.
 */
export const visualCustomer: Customer = {
  name: 'Visual Customer',
  email: 'visual.customer@example.com',
  phone: '+91-9876543210',
};

export const visualEvent = (testCaseId: string, totalSeats = 50) => ({
  title: `Visual ${testCaseId}`,
  description: 'Fixed event used for visual baselines.',
  price: 250,
  totalSeats,
});
