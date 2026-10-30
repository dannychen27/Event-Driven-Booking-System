export type EventCandidate = {
  id: number;
  name: string;
  description?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  start_time?: string | Date;
};

export type EventAvailability = {
  capacity: number;
  booked: number;
  available: number;
};

export type EventId = {
  id: number;
};

export type EventLock = {
  id: number;
  start_time: string | Date;
  end_time: string | Date;
  capacity: number;
};

export type EventWithVenue = {
  // Event columns plus:
  venue_name: string;
  venue_address: string;
};
