import {
    getTimeOfDayIntervals,
    TIME_OF_DAY_RANGES,
    type TimeOfDay,
    type TimeInterval,
} from '../../5. shared/src/time-of-day';

const MINUTES_PER_DAY = 1440;

function containsMinute(
    intervals: TimeInterval[],
    minute: number,
): boolean {
    return intervals.some(
        ({ startMinute, endMinute }) =>
            minute >= startMinute && minute < endMinute,
    );
}

describe('TIME_OF_DAY_RANGES', () => {

    it('defines all five time-of-day periods', () => {
        expect(Object.keys(TIME_OF_DAY_RANGES)).toEqual([
            'EARLY_MORNING',
            'MORNING',
            'AFTERNOON',
            'EVENING',
            'NIGHT',
        ]);
    });

    it.each([
        ['EARLY_MORNING', 300, 480],
        ['MORNING', 480, 720],
        ['AFTERNOON', 720, 1020],
        ['EVENING', 1020, 1260],
        ['NIGHT', 1260, 300],
    ] as [TimeOfDay, number, number][])(
        'defines %s as %i to %i minutes',
        (period, startMinute, endMinute) => {
            expect(TIME_OF_DAY_RANGES[period]).toEqual({
                startMinute,
                endMinute,
            });
        },
    );
});

describe('getTimeOfDayIntervals', () => {

    it.each([
        ['EARLY_MORNING', 300, 480],
        ['MORNING', 480, 720],
        ['AFTERNOON', 720, 1020],
        ['EVENING', 1020, 1260],
    ] as [TimeOfDay, number, number][])(
        'returns one interval for %s',
        (period, startMinute, endMinute) => {
            expect(getTimeOfDayIntervals(period)).toEqual([
                { startMinute, endMinute },
            ]);
        },
    );

    it('splits NIGHT into two intervals around midnight', () => {
        expect(getTimeOfDayIntervals('NIGHT')).toEqual([
            { startMinute: 0, endMinute: 300 },
            { startMinute: 1260, endMinute: 1440 },
        ]);
    });

    it('returns intervals within valid minute bounds', () => {
        const periods = Object.keys(
            TIME_OF_DAY_RANGES,
        ) as TimeOfDay[];

        for (const period of periods) {
            for (const interval of getTimeOfDayIntervals(period)) {
                expect(interval.startMinute).toBeGreaterThanOrEqual(0);
                expect(interval.startMinute).toBeLessThan(MINUTES_PER_DAY);
                expect(interval.endMinute).toBeGreaterThan(0);
                expect(interval.endMinute).toBeLessThanOrEqual(
                    MINUTES_PER_DAY,
                );
                expect(interval.startMinute).toBeLessThan(
                    interval.endMinute,
                );
            }
        }
    });
});

describe('time-of-day boundary behavior', () => {
    it.each([
        [299, 'NIGHT'],
        [300, 'EARLY_MORNING'],
        [479, 'EARLY_MORNING'],
        [480, 'MORNING'],
        [719, 'MORNING'],
        [720, 'AFTERNOON'],
        [1019, 'AFTERNOON'],
        [1020, 'EVENING'],
        [1259, 'EVENING'],
        [1260, 'NIGHT'],
        [1439, 'NIGHT'],
        [0, 'NIGHT'],
    ] as [number, TimeOfDay][])(
        'assigns minute %i to %s',
        (minute, expectedPeriod) => {
            const matchingPeriods = (
                Object.keys(TIME_OF_DAY_RANGES) as TimeOfDay[]
            ).filter((period) =>
                containsMinute(
                    getTimeOfDayIntervals(period),
                    minute,
                ),
            );

            expect(matchingPeriods).toEqual([expectedPeriod]);
        },
    );

    it('assigns every minute of the day to exactly one period', () => {
        const periods = Object.keys(TIME_OF_DAY_RANGES) as TimeOfDay[];

        for (let minute = 0; minute < MINUTES_PER_DAY; minute++) {
            const matchingPeriods = periods.filter((period) =>
                containsMinute(getTimeOfDayIntervals(period), minute),
            );

            expect(matchingPeriods).toHaveLength(1);
        }
    });

    it('treats midnight as the start of NIGHT', () => {
        const nightIntervals = getTimeOfDayIntervals('NIGHT');

        expect(containsMinute(nightIntervals, 0)).toBe(true);
        expect(containsMinute(nightIntervals, 299)).toBe(true);
        expect(containsMinute(nightIntervals, 300)).toBe(false);
        expect(containsMinute(nightIntervals, 1439)).toBe(true);
    });

    it('does not include the exclusive end of any interval', () => {
        const periods = Object.keys(
            TIME_OF_DAY_RANGES,
        ) as TimeOfDay[];

        for (const period of periods) {
            const intervals = getTimeOfDayIntervals(period);

            for (const interval of intervals) {
                expect(
                    containsMinute(intervals, interval.endMinute),
                ).toBe(false);
            }
        }
    });
});
