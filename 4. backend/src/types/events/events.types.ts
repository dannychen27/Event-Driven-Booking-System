export type EventCandidate = {
  id: number;
  name: string;
  description?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  start_time?: string | Date;
};

export type EventWithVenue = {
  id: number;
  name: string;
  venue_id: number;
  venue_name: string;
  venue_address: string;
  start_time: string | Date;
  end_time: string | Date;
  capacity: number;
  description?: string | null;
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
