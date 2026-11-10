import { TimeOfDay } from "../../types/search/time-range.types";

export const VALID_TIME_OF_DAYS = new Set<TimeOfDay>([
    'EARLY_MORNING',
    'MORNING',
    'AFTERNOON',
    'EVENING',
    'NIGHT',
]);
