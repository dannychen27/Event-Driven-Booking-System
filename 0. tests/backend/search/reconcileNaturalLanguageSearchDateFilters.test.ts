import { DateTime } from 'luxon';

import {
    CalendarDateRange,
    ExplicitSelection,
} from '../../../4. backend/src/types/search/natural-language-search-request.types';

import { reconcileDateFilter } from '../../../4. backend/src/search/natural-language-search-filter-reconciler';
import { ResolvedDateRange } from '../../../4. backend/src/search/relative-date-range.resolver';

const TORONTO_TIMEZONE = 'America/Toronto';

function makeCalendarSelection(
    startDate: string,
    endDate: string,
): ExplicitSelection<CalendarDateRange> {
    return {
        state: 'selected',
        value: { startDate, endDate },
    };
}

function makeAiRange(
    startDate: string,
    endDate: string,
): ResolvedDateRange {
    const start = DateTime.fromISO(startDate, {
        zone: TORONTO_TIMEZONE,
    }).startOf('day');

    const end = DateTime.fromISO(endDate, {
        zone: TORONTO_TIMEZONE,
    }).startOf('day');

    return {
        startAfter: start.toUTC().toISO()!,
        startBefore: end.toUTC().toISO()!,
    };
}

describe('reconcileDateFilter', () => {

    describe('valid combinations', () => {

        it('should use the AI date range when the calendar is untouched', () => {
            const aiRange = makeAiRange(
                '2026-11-10',
                '2026-11-11',
            );

            expect(
                reconcileDateFilter({ aiRange }),
            ).toEqual({
                filters: aiRange,
            });
        });

        it('should use the calendar range when AI has no date restriction', () => {
            const selection = makeCalendarSelection(
                '2026-11-10',
                '2026-11-12',
            );

            const result = reconcileDateFilter({ selection });

            expect(result).toEqual({
                filters: {
                    startAfter: '2026-11-10T05:00:00.000Z',
                    startBefore: '2026-11-13T05:00:00.000Z',
                },
            });
        });

        it('should intersect identical AI and calendar ranges', () => {
            const aiRange = makeAiRange(
                '2026-11-10',
                '2026-11-11',
            );

            const selection = makeCalendarSelection(
                '2026-11-10',
                '2026-11-10',
            );

            expect(
                reconcileDateFilter({ aiRange, selection }),
            ).toEqual({
                filters: {
                    startAfter: '2026-11-10T05:00:00.000Z',
                    startBefore: '2026-11-11T05:00:00.000Z',
                },
            });
        });

        it('should preserve the AI range when the calendar contains it', () => {
            const aiRange = makeAiRange(
                '2026-11-11',
                '2026-11-12',
            );

            const selection = makeCalendarSelection(
                '2026-11-09',
                '2026-11-13',
            );

            expect(
                reconcileDateFilter({ aiRange, selection }),
            ).toEqual({
                filters: aiRange,
            });
        });

        it('should return the intersection of partially overlapping ranges', () => {
            const aiRange = makeAiRange(
                '2026-11-10',
                '2026-11-13',
            );

            const selection = makeCalendarSelection(
                '2026-11-12',
                '2026-11-15',
            );

            expect(
                reconcileDateFilter({ aiRange, selection }),
            ).toEqual({
                filters: {
                    startAfter: '2026-11-12T05:00:00.000Z',
                    startBefore: '2026-11-13T05:00:00.000Z',
                },
            });
        });

        it('should support AI ranges with only a start boundary', () => {
            const aiRange = {
                startAfter: '2026-11-10T05:00:00.000Z',
            };

            const selection = makeCalendarSelection(
                '2026-11-09',
                '2026-11-12',
            );

            expect(
                reconcileDateFilter({ aiRange, selection }),
            ).toEqual({
                filters: {
                    startAfter: '2026-11-10T05:00:00.000Z',
                    startBefore: '2026-11-13T05:00:00.000Z',
                },
            });
        });
    });

    describe('conflicts', () => {

        it('should request clarification for disjoint ranges', () => {
            const aiRange = makeAiRange(
                '2026-11-10',
                '2026-11-11',
            );

            const selection = makeCalendarSelection(
                '2026-11-13',
                '2026-11-14',
            );

            const result = reconcileDateFilter({
                aiRange,
                selection,
            });

            expect(result.conflict).toMatchObject({
                category: 'date',
            });

            expect(result.conflict?.aiInterpretation).toBeTruthy();
            expect(result.conflict?.userSelection).toBeTruthy();
        });

        it('should request clarification when the calendar was explicitly cleared', () => {
            const aiRange = makeAiRange(
                '2026-11-10',
                '2026-11-11',
            );

            const selection: ExplicitSelection<CalendarDateRange> = {
                state: 'cleared',
            };

            const result = reconcileDateFilter({
                aiRange,
                selection,
            });

            expect(result.conflict).toMatchObject({
                category: 'date',
                userSelection: 'Explicitly cleared date filter',
            });
        });

        it('should not conflict when a cleared calendar selection has no AI restriction', () => {
            const selection: ExplicitSelection<CalendarDateRange> = {
                state: 'cleared',
            };

            expect(
                reconcileDateFilter({ selection }),
            ).toEqual({
                filters: {},
            });
        });
    });

    describe('explicit resolutions', () => {

        it('should use the AI interpretation when resolution is ai', () => {
            const aiRange = makeAiRange(
                '2026-11-10',
                '2026-11-11',
            );

            const selection = makeCalendarSelection(
                '2026-11-13',
                '2026-11-14',
            );

            expect(
                reconcileDateFilter({
                    aiRange,
                    selection,
                    resolution: 'ai',
                }),
            ).toEqual({
                filters: aiRange,
            });
        });

        it('should use the calendar interpretation when resolution is selection', () => {
            const aiRange = makeAiRange(
                '2026-11-10',
                '2026-11-11',
            );

            const selection = makeCalendarSelection(
                '2026-11-13',
                '2026-11-14',
            );

            expect(
                reconcileDateFilter({
                    aiRange,
                    selection,
                    resolution: 'selection',
                }),
            ).toEqual({
                filters: {
                    startAfter: '2026-11-13T05:00:00.000Z',
                    startBefore: '2026-11-15T05:00:00.000Z',
                },
            });
        });

        it('should remove the date restriction when a cleared selection is resolved as selection', () => {
            const aiRange = makeAiRange(
                '2026-11-10',
                '2026-11-11',
            );

            const selection: ExplicitSelection<CalendarDateRange> = {
                state: 'cleared',
            };

            expect(
                reconcileDateFilter({
                    aiRange,
                    selection,
                    resolution: 'selection',
                }),
            ).toEqual({
                filters: {},
            });
        });

        it('should retain the AI restriction when a cleared selection is resolved as ai', () => {
            const aiRange = makeAiRange(
                '2026-11-10',
                '2026-11-11',
            );

            const selection: ExplicitSelection<CalendarDateRange> = {
                state: 'cleared',
            };

            expect(
                reconcileDateFilter({
                    aiRange,
                    selection,
                    resolution: 'ai',
                }),
            ).toEqual({
                filters: aiRange,
            });
        });
    });

    describe('Toronto daylight saving time', () => {

        it('should create a 23-hour UTC interval across spring-forward', () => {
            const result = reconcileDateFilter({
                selection: makeCalendarSelection(
                    '2026-03-08',
                    '2026-03-08',
                ),
            });

            expect(result).toEqual({
                filters: {
                    startAfter: '2026-03-08T05:00:00.000Z',
                    startBefore: '2026-03-09T04:00:00.000Z',
                },
            });

            const duration =
                Date.parse(result.filters!.startBefore!) -
                Date.parse(result.filters!.startAfter!);

            expect(duration).toBe(23 * 60 * 60 * 1000);
        });

        it('should create a 25-hour UTC interval across fall-back', () => {
            const result = reconcileDateFilter({
                selection: makeCalendarSelection(
                    '2026-11-01',
                    '2026-11-01',
                ),
            });

            expect(result).toEqual({
                filters: {
                    startAfter: '2026-11-01T04:00:00.000Z',
                    startBefore: '2026-11-02T05:00:00.000Z',
                },
            });

            const duration =
                Date.parse(result.filters!.startBefore!) -
                Date.parse(result.filters!.startAfter!);

            expect(duration).toBe(25 * 60 * 60 * 1000);
        });
    });
});
