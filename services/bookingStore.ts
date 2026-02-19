import { BookingRecord } from '../types';

const STORAGE_KEY = 'mamao_bookings';

export function saveBooking(record: BookingRecord): void {
  const existing = getBookings();
  existing.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function getBookings(): BookingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BookingRecord[];
  } catch {
    return [];
  }
}

export function clearBookings(): void {
  localStorage.removeItem(STORAGE_KEY);
}
