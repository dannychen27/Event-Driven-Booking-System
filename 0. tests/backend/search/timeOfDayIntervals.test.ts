import { buildTimeOfDayIntervals } from '../../../4. backend/src/search/time-of-day-intervals';

describe('buildTimeOfDayIntervals', () => {
    it('should return undefined when no time-of-day filter is supplied', () => {
        expect(buildTimeOfDayIntervals()).toBeUndefined();
    });

    it('should return an empty array for an empty selection', () => {
        expect(buildTimeOfDayIntervals([])).toEqual([]);
    });

    it('should map a single period to its interval', () => {
        expect(buildTimeOfDayIntervals(['MORNING'])).toEqual([
            { startMinute: 480, endMinute: 720 },
        ]);
    });

    it('should represent NIGHT as two intervals across midnight', () => {
        expect(buildTimeOfDayIntervals(['NIGHT'])).toEqual([
            { startMinute: 0, endMinute: 300 },
            { startMinute: 1260, endMinute: 1440 },
        ]);
    });

    it('should preserve separate intervals for non-adjacent periods', () => {
        expect(buildTimeOfDayIntervals([
            'MORNING',
            'EVENING',
        ])).toEqual([
            { startMinute: 480, endMinute: 720 },
            { startMinute: 1020, endMinute: 1260 },
        ]);
    });

    it('should merge adjacent periods', () => {
        expect(buildTimeOfDayIntervals([
            'MORNING',
            'AFTERNOON',
        ])).toEqual([
            { startMinute: 480, endMinute: 1020 },
        ]);
    });

    it('should merge all five periods into a full-day interval', () => {
        expect(buildTimeOfDayIntervals([
            'EARLY_MORNING',
            'MORNING',
            'AFTERNOON',
            'EVENING',
            'NIGHT',
        ])).toEqual([
            { startMinute: 0, endMinute: 1440 },
        ]);
    });
});
