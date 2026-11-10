import { buildEventDateRangeFilters } from '../../../4. backend/src/events/events.helpers';

describe('buildEventDateRangeFilters', () => {
    const localTime = "(e.start_time AT TIME ZONE 'America/Toronto')::time";

    describe('timeIntervals', () => {

        it.each([
            [
                'EARLY_MORNING',
                [{ startMinute: 300, endMinute: 480 }],
                ['05:00', '08:00'],
            ],
            [
                'MORNING',
                [{ startMinute: 480, endMinute: 720 }],
                ['08:00', '12:00'],
            ],
            [
                'AFTERNOON',
                [{ startMinute: 720, endMinute: 1020 }],
                ['12:00', '17:00'],
            ],
            [
                'EVENING',
                [{ startMinute: 1020, endMinute: 1260 }],
                ['17:00', '21:00'],
            ],
        ] as const)(
            'filters %s using its local-time boundaries',
            (_period, timeIntervals, expectedParams) => {
                const result = buildEventDateRangeFilters({
                    timeIntervals: [...timeIntervals],
                });

                expect(result.conditions).toHaveLength(1);
                expect(result.conditions[0]).toContain(`${localTime} >= $1::time`);
                expect(result.conditions[0]).toContain(`${localTime} < $2::time`);
                expect(result.params).toEqual([...expectedParams]);
            },
        );

        it('uses an OR condition for NIGHT', () => {
            const result = buildEventDateRangeFilters({
                timeIntervals: [
                    { startMinute: 0, endMinute: 300 },
                    { startMinute: 1260, endMinute: 1440 },
                ],
            });

            expect(result.conditions).toHaveLength(1);
            expect(result.conditions[0]).toContain(' OR ');
            expect(result.conditions[0]).toContain(`${localTime} < $1::time`);
            expect(result.conditions[0]).toContain(`${localTime} >= $2::time`);
            expect(result.params).toEqual(['05:00', '21:00']);
        });

        it('uses OR for multiple disjoint periods', () => {
            const result = buildEventDateRangeFilters({
                timeIntervals: [
                    { startMinute: 480, endMinute: 720 },
                    { startMinute: 1020, endMinute: 1260 },
                ],
            });

            expect(result.conditions[0]).toContain(' OR ');
            expect(result.params).toEqual([
                '08:00',
                '12:00',
                '17:00',
                '21:00',
            ]);
        });

        it('returns no events for an empty interval set', () => {
            const result = buildEventDateRangeFilters({
                timeIntervals: [],
            });

            expect(result.conditions).toEqual(['FALSE']);
            expect(result.params).toEqual([]);
        });
    });

    describe('timeRange', () => {

        it('supports a bounded same-day range', () => {
            const result = buildEventDateRangeFilters({
                timeRange: { startTime: '18:00', endTime: '21:00' },
            });

            expect(result.conditions).toEqual([
                `(${localTime} >= $1::time AND ${localTime} < $2::time)`,
            ]);
            expect(result.params).toEqual(['18:00', '21:00']);
        });

        it('supports a cross-midnight range', () => {
            const result = buildEventDateRangeFilters({
                timeRange: { startTime: '22:00', endTime: '02:00' },
            });

            expect(result.conditions).toEqual([
                `(${localTime} >= $1::time OR ${localTime} < $2::time)`,
            ]);
            expect(result.params).toEqual(['22:00', '02:00']);
        });

        it('supports a start-only range', () => {
            const result = buildEventDateRangeFilters({
                timeRange: { startTime: '20:00' },
            });

            expect(result.conditions).toEqual([`${localTime} >= $1::time`]);
            expect(result.params).toEqual(['20:00']);
        });

        it('supports an end-only range', () => {
            const result = buildEventDateRangeFilters({
                timeRange: { endTime: '10:00' },
            });

            expect(result.conditions).toEqual([`${localTime} < $1::time`]);
            expect(result.params).toEqual(['10:00']);
        });

        it('accounts for existing query parameters', () => {
            const result = buildEventDateRangeFilters({
                startAfter: '2026-11-09T00:00:00.000Z',
                timeRange: { startTime: '18:00', endTime: '21:00' },
                initialParamCount: 1,
            });

            expect(result.conditions).toContain('e.start_time >= $2');
            expect(result.conditions).toContain(
                `(${localTime} >= $3::time AND ${localTime} < $4::time)`,
            );
            expect(result.params).toEqual([
                '2026-11-09T00:00:00.000Z',
                '18:00',
                '21:00',
            ]);
        });
    });

    it('intersects named periods and explicit ranges as separate conditions', () => {
        const result = buildEventDateRangeFilters({
            timeRange: { startTime: '18:00', endTime: '20:00' },
            timeIntervals: [
                { startMinute: 1020, endMinute: 1260 },
            ],
        });

        expect(result.conditions).toHaveLength(2);
        expect(result.conditions[0]).toContain('$1::time');
        expect(result.conditions[1]).toContain('$3::time');
        expect(result.conditions[1]).toContain('$4::time');
        expect(result.params).toEqual([
            '18:00',
            '20:00',
            '17:00',
            '21:00',
        ]);
    });
});
