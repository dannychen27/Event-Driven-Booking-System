import { buildEventDateRangeFilters } from '../../../4. backend/src/events/events.helpers';

describe('buildEventDateRangeFilters', () => {
    const localTime = "(e.start_time AT TIME ZONE 'America/Toronto')::time";

    describe('timeOfDay', () => {

        it.each([
            ['EARLY_MORNING', ">= TIME '05:00'", "< TIME '08:00'"],
            ['MORNING', ">= TIME '08:00'", "< TIME '12:00'"],
            ['AFTERNOON', ">= TIME '12:00'", "< TIME '17:00'"],
            ['EVENING', ">= TIME '17:00'", "< TIME '21:00'"],
        ] as const)('filters %s using its local-time boundaries',
            (period, start, end) => {
                const result = buildEventDateRangeFilters({
                    timeOfDay: period,
                });

                expect(result.conditions).toHaveLength(1);
                expect(result.conditions[0]).toContain(`${localTime} ${start}`);
                expect(result.conditions[0]).toContain(`${localTime} ${end}`);
                expect(result.params).toEqual([]);
            }
        );

        it('uses an OR condition for NIGHT', () => {
            const result = buildEventDateRangeFilters({
                timeOfDay: 'NIGHT',
            });

            expect(result.conditions[0]).toContain(`${localTime} >= TIME '21:00'`);
            expect(result.conditions[0]).toContain(' OR ');
            expect(result.conditions[0]).toContain(`${localTime} < TIME '05:00'`);
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

    it('combines named periods and explicit ranges as separate conditions', () => {
        const result = buildEventDateRangeFilters({
            timeOfDay: 'EVENING',
            timeRange: { startTime: '18:00', endTime: '20:00' },
        });

        expect(result.conditions).toHaveLength(2);
        expect(result.conditions[0]).toContain("TIME '17:00'");
        expect(result.conditions[1]).toContain('$1::time');
        expect(result.conditions[1]).toContain('$2::time');
        expect(result.params).toEqual(['18:00', '20:00']);
    });
});
