import { resolveRelativeDateRange } from '../../../4. backend/src/search/relative-date-range.resolver';
import { RelativeDateRange } from '../../../4. backend/src/types/search/relative-date-range.types';

describe('resolveRelativeDateRange', () => {
    const referenceDate = new Date('2026-11-04T17:00:00.000Z');

    const expectRange = (
        relativeDate: RelativeDateRange,
        startAfter: string,
        startBefore: string,
        date = referenceDate,
    ) => {
        expect(resolveRelativeDateRange(relativeDate, date))
            .toEqual({ startAfter, startBefore });
    };

    describe('calendar days', () => {
        it('resolves today', () => {
            expectRange(
                { kind: 'TODAY' },
                '2026-11-04T05:00:00.000Z',
                '2026-11-05T05:00:00.000Z',
            );
        });

        it('resolves tomorrow', () => {
            expectRange(
                { kind: 'TOMORROW' },
                '2026-11-05T05:00:00.000Z',
                '2026-11-06T05:00:00.000Z',
            );
        });

        it('resolves yesterday', () => {
            expectRange(
                { kind: 'YESTERDAY' },
                '2026-11-03T05:00:00.000Z',
                '2026-11-04T05:00:00.000Z',
            );
        });

        it('resolves calendar days from now', () => {
            expectRange(
                { kind: 'DAYS_FROM_NOW', days: 2 },
                '2026-11-06T05:00:00.000Z',
                '2026-11-07T05:00:00.000Z',
            );
        });

        it('resolves calendar days ago', () => {
            expectRange(
                { kind: 'DAYS_AGO', days: 2 },
                '2026-11-02T05:00:00.000Z',
                '2026-11-03T05:00:00.000Z',
            );
        });
    });

    describe('weekends', () => {
        it('resolves this weekend', () => {
            expectRange(
                { kind: 'THIS_WEEKEND' },
                '2026-11-07T05:00:00.000Z',
                '2026-11-09T05:00:00.000Z',
            );
        });

        it('resolves next weekend', () => {
            expectRange(
                { kind: 'NEXT_WEEKEND' },
                '2026-11-14T05:00:00.000Z',
                '2026-11-16T05:00:00.000Z',
            );
        });

        it('resolves a weekend across the spring DST transition', () => {
            expectRange(
                { kind: 'THIS_WEEKEND' },
                '2026-03-07T05:00:00.000Z',
                '2026-03-09T04:00:00.000Z',
                new Date('2026-03-04T17:00:00.000Z'),
            );
        });

        it('resolves a weekend across the fall DST transition', () => {
            expectRange(
                { kind: 'THIS_WEEKEND' },
                '2026-10-31T04:00:00.000Z',
                '2026-11-02T05:00:00.000Z',
                new Date('2026-10-28T17:00:00.000Z'),
            );
        });
    });

    describe('calendar weeks', () => {

        it('resolves this week from Sunday through Saturday', () => {
            expectRange(
                { kind: 'THIS_WEEK' },
                '2026-11-01T04:00:00.000Z',
                '2026-11-08T05:00:00.000Z',
            );
        });

        it('resolves next week from Sunday through Saturday', () => {
            expectRange(
                { kind: 'NEXT_WEEK' },
                '2026-11-08T05:00:00.000Z',
                '2026-11-15T05:00:00.000Z',
            );
        });

        it('resolves last week from Sunday through Saturday', () => {
            expectRange(
                { kind: 'LAST_WEEK' },
                '2026-10-25T04:00:00.000Z',
                '2026-11-01T04:00:00.000Z',
            );
        });

        it('resolves next week correctly when today is Monday', () => {
            expectRange(
                { kind: 'NEXT_WEEK' },
                '2026-11-15T05:00:00.000Z',
                '2026-11-22T05:00:00.000Z',
                new Date('2026-11-09T17:00:00.000Z'),
            );
        });

        it('resolves a week containing the spring DST transition', () => {
            expectRange(
                { kind: 'THIS_WEEK' },
                '2026-03-08T05:00:00.000Z',
                '2026-03-15T04:00:00.000Z',
                new Date('2026-03-11T16:00:00.000Z'),
            );
        });

        it('resolves a week containing the fall DST transition', () => {
            expectRange(
                { kind: 'THIS_WEEK' },
                '2026-11-01T04:00:00.000Z',
                '2026-11-08T05:00:00.000Z',
                new Date('2026-11-04T17:00:00.000Z'),
            );
        });
    });

    describe('named weekdays', () => {
        it('resolves this weekday within the current week', () => {
            expectRange(
                { kind: 'WEEKDAY', weekday: 'MONDAY', occurrence: 'THIS' },
                '2026-11-02T05:00:00.000Z',
                '2026-11-03T05:00:00.000Z',
            );
        });

        it('resolves next occurrence of a weekday', () => {
            expectRange(
                { kind: 'WEEKDAY', weekday: 'FRIDAY', occurrence: 'NEXT' },
                '2026-11-06T05:00:00.000Z',
                '2026-11-07T05:00:00.000Z',
            );
        });

        it('resolves last occurrence of a weekday', () => {
            expectRange(
                { kind: 'WEEKDAY', weekday: 'MONDAY', occurrence: 'LAST' },
                '2026-11-02T05:00:00.000Z',
                '2026-11-03T05:00:00.000Z',
            );
        });

        it('treats next occurrence of today as seven days later', () => {
            expectRange(
                { kind: 'WEEKDAY', weekday: 'WEDNESDAY', occurrence: 'NEXT' },
                '2026-11-11T05:00:00.000Z',
                '2026-11-12T05:00:00.000Z',
            );
        });
    });

    describe('business days', () => {
        it('resolves the next business day', () => {
            expectRange(
                { kind: 'NEXT_BUSINESS_DAY' },
                '2026-11-05T05:00:00.000Z',
                '2026-11-06T05:00:00.000Z',
            );
        });

        it('resolves the previous business day', () => {
            expectRange(
                { kind: 'PREVIOUS_BUSINESS_DAY' },
                '2026-11-03T05:00:00.000Z',
                '2026-11-04T05:00:00.000Z',
            );
        });

        it('skips weekends when moving forward', () => {
            expectRange(
                { kind: 'BUSINESS_DAYS_FROM_NOW', days: 3 },
                '2026-11-09T05:00:00.000Z',
                '2026-11-10T05:00:00.000Z',
            );
        });

        it('skips weekends when moving backward', () => {
            expectRange(
                { kind: 'BUSINESS_DAYS_AGO', days: 3 },
                '2026-10-30T04:00:00.000Z',
                '2026-10-31T04:00:00.000Z',
            );
        });
    });

    describe('timezone and DST', () => {
        it('uses the Toronto calendar date rather than the UTC date', () => {
            expectRange(
                { kind: 'TODAY' },
                '2026-11-04T05:00:00.000Z',
                '2026-11-05T05:00:00.000Z',
                new Date('2026-11-05T02:00:00.000Z'),
            );
        });

        it('resolves a 23-hour calendar day during spring DST', () => {
            expectRange(
                { kind: 'TOMORROW' },
                '2026-03-08T05:00:00.000Z',
                '2026-03-09T04:00:00.000Z',
                new Date('2026-03-07T17:00:00.000Z'),
            );
        });

        it('resolves a 25-hour calendar day during fall DST', () => {
            expectRange(
                { kind: 'TOMORROW' },
                '2026-11-01T04:00:00.000Z',
                '2026-11-02T05:00:00.000Z',
                new Date('2026-10-31T16:00:00.000Z'),
            );
        });
    });

    describe('validation', () => {
        it.each([0, -1, 1.5, 366])(
            'rejects invalid calendar-day offset %s',
            (days) => {
                expect(() =>
                    resolveRelativeDateRange(
                        { kind: 'DAYS_FROM_NOW', days },
                        referenceDate,
                    ),
                ).toThrow();
            },
        );

        it.each([0, -1, 1.5, 366])(
            'rejects invalid business-day offset %s',
            (days) => {
                expect(() =>
                    resolveRelativeDateRange(
                        { kind: 'BUSINESS_DAYS_FROM_NOW', days },
                        referenceDate,
                    ),
                ).toThrow();
            },
        );

        it('rejects an invalid reference date', () => {
            expect(() =>
                resolveRelativeDateRange(
                    { kind: 'TODAY' },
                    new Date('invalid'),
                ),
            ).toThrow(/reference date/i);
        });
    });
});
