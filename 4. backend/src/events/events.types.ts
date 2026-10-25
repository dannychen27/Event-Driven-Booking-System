export type EventCandidate = {
  id: number;
  name: string;
  description?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  start_time?: string | Date;
};
