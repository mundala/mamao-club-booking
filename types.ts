import React from 'react';

export enum BookingStep {
  PEOPLE = 0,
  DATE = 1,
  CONFIRMATION = 2,
  SUCCESS = 3
}

export interface BookingState {
  peopleCount: number;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  name: string;
  phone: string;
  email: string;
  notes: string;
  souvenirUrl?: string;
  confirmationUrl?: string;
  bookingRef?: string;
}

export interface BookingRecord {
  ref: string;
  name: string;
  phone: string;
  email: string;
  peopleCount: number;
  date: string;       // ISO string
  time: string;       // HH:MM
  notes: string;
  createdAt: string;  // ISO string
}

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}