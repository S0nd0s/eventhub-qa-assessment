/* Shapes as the API actually returns them  */

export interface EventDto {
  id: number;
  title: string;
  description: string;
  category: string;
  venue: string;
  city: string;
  eventDate: string;
  price: string;
  totalSeats: number;
  availableSeats: number;
  isStatic: boolean;
}

export interface CreateEventInput {
  title: string;
  description: string;
  category: string;
  venue: string;
  city: string;
  eventDate: string;
  price: number;
  totalSeats: number;
}

export interface BookingDto {
  id: number;
  eventId: number;
  userId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  totalPrice: string;
  status: string;
  bookingRef: string;
  createdAt: string;
  event?: EventDto;
}

export interface CreateBookingInput {
  eventId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
