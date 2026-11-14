import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';
import { BookingDto } from '../../../src/api/types';


test('TC-API-LIST-07: page and limit split the list correctly and report the right totals', async ({ createEvent, bookingsApi }) => {
  const event = await createEvent();
  const created: BookingDto[] = [];
  for (let i = 0; i < 5; i++) created.push(await bookingsApi.create(aBookingRequest(event.id)));
  const newestFirst = created.map((b) => b.id).reverse();

  const page = async (params: Record<string, number>) => (await bookingsApi.listRaw({ eventId: event.id, ...params })).json();

  await test.step('limit=2, page=1: first 2 of 5, 3 pages in total', async () => {
    const body = await page({ limit: 2, page: 1 });
    expect(body.data.map((b: BookingDto) => b.id)).toEqual(newestFirst.slice(0, 2));
    expect(body.pagination).toEqual({ total: 5, page: 1, limit: 2, totalPages: 3 });
  });

  await test.step('limit=2, page=2: the next 2', async () => {
    const body = await page({ limit: 2, page: 2 });
    expect(body.data.map((b: BookingDto) => b.id)).toEqual(newestFirst.slice(2, 4));
    expect(body.pagination).toEqual({ total: 5, page: 2, limit: 2, totalPages: 3 });
  });

  await test.step('limit=2, page=3: the last one', async () => {
    const body = await page({ limit: 2, page: 3 });
    expect(body.data.map((b: BookingDto) => b.id)).toEqual(newestFirst.slice(4));
    expect(body.pagination).toEqual({ total: 5, page: 3, limit: 2, totalPages: 3 });
  });

  await test.step('a page past the end is empty but still reports the totals', async () => {
    const body = await page({ limit: 2, page: 4 });
    expect(body.data).toEqual([]);
    expect(body.pagination).toMatchObject({ total: 5, page: 4, totalPages: 3 });
  });

  await test.step('default page size is 10: all 5 on one page', async () => {
    const body = await page({});
    expect(body.data).toHaveLength(5);
    expect(body.pagination).toEqual({ total: 5, page: 1, limit: 10, totalPages: 1 });
  });

  await test.step('no booking appears on two pages', async () => {
    const ids = [
      ...(await page({ limit: 2, page: 1 })).data,
      ...(await page({ limit: 2, page: 2 })).data,
      ...(await page({ limit: 2, page: 3 })).data,
    ].map((b: BookingDto) => b.id);
    expect(new Set(ids).size).toBe(5);
  });
});
