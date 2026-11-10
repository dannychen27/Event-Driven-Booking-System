import { buildEventDateRangeFilters } from '../../../4. backend/src/events/events.helpers';

describe('buildEventDateRangeFilters with normalized time intervals', () => {
    const localEventTime = "(e.start_time AT TIME ZONE 'America/Toronto')::time";

    it('should generate a parameterized condition for one ordinary interval', () => {
        const result = buildEventDateRangeFilters({
            timeIntervals: [
                { startMinute: 1080, endMinute: 1200 },
            ],
        });

        expect(result.conditions).toEqual([
            `(${localEventTime} >= $1::time AND ${localEventTime} < $2::time)`,
        ]);
        expect(result.params).toEqual(['18:00', '20:00']);
    });

    it('should generate an OR condition for disconnected intervals', () => {
        const result = buildEventDateRangeFilters({
            timeIntervals: [
                { startMinute: 60, endMinute: 120 },
                { startMinute: 1320, endMinute: 1380 },
            ],
        });

        expect(result.conditions).toEqual([
            `((${localEventTime} >= $1::time AND ${localEventTime} < $2::time) OR (${localEventTime} >= $3::time AND ${localEventTime} < $4::time))`,
        ]);
        expect(result.params).toEqual([ '01:00', '02:00', '22:00', '23:00' ]);
    });

    it('should omit the lower bound for an interval starting at midnight', () => {
        const result = buildEventDateRangeFilters({
            timeIntervals: [
                { startMinute: 0, endMinute: 120 },
            ],
        });

        expect(result.conditions).toEqual([ `(${localEventTime} < $1::time)` ]);
        expect(result.params).toEqual(['02:00']);
    });

    it('should omit the upper bound for an interval ending at midnight', () => {
        const result = buildEventDateRangeFilters({
            timeIntervals: [
                { startMinute: 1320, endMinute: 1440 },
            ],
        });

        expect(result.conditions).toEqual([`(${localEventTime} >= $1::time)`]);
        expect(result.params).toEqual(['22:00']);
    });

    it('should represent the entire day without time parameters', () => {
        const result = buildEventDateRangeFilters({
            timeIntervals: [
                { startMinute: 0, endMinute: 1440 },
            ],
        });

        expect(result.conditions).toEqual(['(TRUE)']);
        expect(result.params).toEqual([]);
    });

    it('should reject an empty interval set rather than removing the time restriction', () => {
        const result = buildEventDateRangeFilters({
            timeIntervals: [],
        });

        expect(result.conditions).toEqual(['FALSE']);
        expect(result.params).toEqual([]);
    });

    it('should preserve parameter numbering after date filters', () => {
        const result = buildEventDateRangeFilters({
            startAfter: '2026-11-10T05:00:00.000Z',
            startBefore: '2026-11-11T05:00:00.000Z',
            timeIntervals: [
                { startMinute: 1080, endMinute: 1200 },
            ],
        });

        expect(result.conditions).toEqual([
            'e.start_time >= $1',
            'e.start_time < $2',
            `(${localEventTime} >= $3::time AND ${localEventTime} < $4::time)`,
        ]);

        expect(result.params).toEqual([
            '2026-11-10T05:00:00.000Z',
            '2026-11-11T05:00:00.000Z',
            '18:00',
            '20:00',
        ]);
    });

    it('should respect an existing initial parameter count', () => {
        const result = buildEventDateRangeFilters({
            timeIntervals: [
                { startMinute: 1080, endMinute: 1200 },
            ],
            initialParamCount: 3,
        });

        expect(result.conditions).toEqual([
            `(${localEventTime} >= $4::time AND ${localEventTime} < $5::time)`,
        ]);
        expect(result.params).toEqual(['18:00', '20:00']);
    });

    it('should reject invalid normalized intervals', () => {
        expect(() =>
            buildEventDateRangeFilters({
                timeIntervals: [
                    { startMinute: -1, endMinute: 120 },
                ],
            })
        ).toThrow('Invalid normalized time interval');

        expect(() =>
            buildEventDateRangeFilters({
                timeIntervals: [
                    { startMinute: 120, endMinute: 120 },
                ],
            })
        ).toThrow('Invalid normalized time interval');

        expect(() =>
            buildEventDateRangeFilters({
                timeIntervals: [
                    { startMinute: 120, endMinute: 1441 },
                ],
            })
        ).toThrow('Invalid normalized time interval');
    });
});
