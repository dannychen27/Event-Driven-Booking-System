import { reconcileTimeFilter } from '../../../4. backend/src/search/natural-language-search-time-reconciler';

import {
    CalendarTimeSelection,
    ExplicitSelection,
} from '../../../4. backend/src/types/search/natural-language-search-request.types';
import {
    NormalizedTimeInterval,
} from '../../../4. backend/src/search/natural-language-search-time-reconciler';


function makeSelection(
    value: CalendarTimeSelection,
): ExplicitSelection<CalendarTimeSelection> {
    return {
        state: 'selected',
        value,
    };
}

describe('reconcileTimeFilter', () => {

    describe('valid combinations', () => {

        it('should use the AI time-of-day when the calendar is untouched', () => {
            expect(
                reconcileTimeFilter({
                    aiTimeOfDay: ['EVENING'],
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 1020, endMinute: 1260 },
                ],
            });
        });

        it('should use the calendar time-of-day when AI has no time restriction', () => {
            expect(
                reconcileTimeFilter({
                    selection: makeSelection({
                        timeOfDay: ['MORNING'],
                    }),
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 480, endMinute: 720 },
                ],
            });
        });

        it('should preserve multiple disjoint calendar time-of-day periods', () => {
            expect(
                reconcileTimeFilter({
                    selection: makeSelection({
                        timeOfDay: ['MORNING', 'EVENING'],
                    }),
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 480, endMinute: 720 },
                    { startMinute: 1020, endMinute: 1260 },
                ],
            });
        });

        it('should intersect matching time-of-day selections', () => {
            expect(
                reconcileTimeFilter({
                    aiTimeOfDay: ['EVENING'],
                    selection: makeSelection({
                        timeOfDay: ['EVENING'],
                    }),
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 1020, endMinute: 1260 },
                ],
            });
        });

        it('should intersect evening with an explicit 18:00–20:00 range', () => {
            expect(
                reconcileTimeFilter({
                    aiTimeOfDay: ['EVENING'],
                    selection: makeSelection({
                        timeRange: {
                            startTime: '18:00',
                            endTime: '20:00',
                        },
                    }),
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 1080, endMinute: 1200 },
                ],
            });
        });

        it('should intersect partially overlapping explicit ranges', () => {
            expect(
                reconcileTimeFilter({
                    aiTimeRange: {
                        startTime: '17:00',
                        endTime: '21:00',
                    },
                    selection: makeSelection({
                        timeRange: {
                            startTime: '19:00',
                            endTime: '22:00',
                        },
                    }),
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 1140, endMinute: 1260 },
                ],
            });
        });

        it('should intersect both time-of-day and time-range constraints', () => {
            expect(
                reconcileTimeFilter({
                    aiTimeOfDay: ['EVENING'],
                    aiTimeRange: {
                        startTime: '18:00',
                        endTime: '22:00',
                    },
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 1080, endMinute: 1260 },
                ],
            });
        });

        it('should support a one-sided start-time restriction', () => {
            expect(
                reconcileTimeFilter({
                    aiTimeRange: {
                        startTime: '20:00',
                    },
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 1200, endMinute: 1440 },
                ],
            });
        });

        it('should support a one-sided end-time restriction', () => {
            expect(
                reconcileTimeFilter({
                    aiTimeRange: {
                        endTime: '10:00',
                    },
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 0, endMinute: 600 },
                ],
            });
        });

        it('should preserve multiple disjoint AI time-of-day periods as OR intervals', () => {
            expect(
                reconcileTimeFilter({
                    aiTimeOfDay: ['MORNING', 'EVENING'],
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 480, endMinute: 720 },
                    { startMinute: 1020, endMinute: 1260 },
                ],
            });
        });
    });

    describe('cross-midnight ranges', () => {

        it('should split a cross-midnight range into two intervals', () => {
            expect(
                reconcileTimeFilter({
                    aiTimeRange: {
                        startTime: '22:00',
                        endTime: '02:00',
                    },
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 0, endMinute: 120 },
                    { startMinute: 1320, endMinute: 1440 },
                ],
            });
        });

        it('should preserve both pieces of a disconnected intersection', () => {
            expect(
                reconcileTimeFilter({
                    aiTimeRange: {
                        startTime: '22:00',
                        endTime: '02:00',
                    },
                    selection: makeSelection({
                        timeRange: {
                            startTime: '01:00',
                            endTime: '23:00',
                        },
                    }),
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 60, endMinute: 120 },
                    { startMinute: 1320, endMinute: 1380 },
                ],
            });
        });

        it('should intersect a cross-midnight range with NIGHT', () => {
            expect(
                reconcileTimeFilter({
                    aiTimeOfDay: ['NIGHT'],
                    aiTimeRange: {
                        startTime: '22:00',
                        endTime: '02:00',
                    },
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 0, endMinute: 120 },
                    { startMinute: 1320, endMinute: 1440 },
                ],
            });
        });

        it('should preserve the intersection of a cross-midnight range and an early-morning range', () => {
            expect(
                reconcileTimeFilter({
                    aiTimeRange: {
                        startTime: '22:00',
                        endTime: '08:00',
                    },
                    selection: makeSelection({
                        timeOfDay: ['EARLY_MORNING'],
                    }),
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 300, endMinute: 480 },
                ],
            });
        });
    });

    describe('conflicts', () => {

        it('should request clarification for evening versus morning', () => {
            const result = reconcileTimeFilter({
                aiTimeOfDay: ['EVENING'],
                selection: makeSelection({
                    timeOfDay: ['MORNING'],
                }),
            });

            expect(result.conflict).toMatchObject({
                category: 'time',
            });

            expect(result.conflict?.aiInterpretation).toBeTruthy();
            expect(result.conflict?.userSelection).toBeTruthy();
        });

        it('should request clarification for disjoint explicit ranges', () => {
            const result = reconcileTimeFilter({
                aiTimeRange: {
                    startTime: '08:00',
                    endTime: '10:00',
                },
                selection: makeSelection({
                    timeRange: {
                        startTime: '18:00',
                        endTime: '20:00',
                    },
                }),
            });

            expect(result.conflict).toMatchObject({
                category: 'time',
            });
        });

        it('should request clarification when the calendar time filter was explicitly cleared', () => {
            const selection: ExplicitSelection<CalendarTimeSelection> = {
                state: 'cleared',
            };

            const result = reconcileTimeFilter({
                aiTimeOfDay: ['EVENING'],
                selection,
            });

            expect(result.conflict).toMatchObject({
                category: 'time',
                userSelection: 'Explicitly cleared time filter',
            });
        });

        it('should not conflict when a cleared calendar filter has no AI restriction', () => {
            const selection: ExplicitSelection<CalendarTimeSelection> = {
                state: 'cleared',
            };

            expect(
                reconcileTimeFilter({ selection }),
            ).toEqual({
                intervals: undefined,
            });
        });
    });

    describe('explicit resolutions', () => {

        it('should use the AI interpretation when resolution is ai', () => {
            expect(
                reconcileTimeFilter({
                    aiTimeOfDay: ['EVENING'],
                    selection: makeSelection({
                        timeOfDay: ['MORNING'],
                    }),
                    resolution: 'ai',
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 1020, endMinute: 1260 },
                ],
            });
        });

        it('should use the calendar interpretation when resolution is selection', () => {
            expect(
                reconcileTimeFilter({
                    aiTimeOfDay: ['EVENING'],
                    selection: makeSelection({
                        timeOfDay: ['MORNING'],
                    }),
                    resolution: 'selection',
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 480, endMinute: 720 },
                ],
            });
        });

        it('should remove the time restriction when a cleared selection is resolved as selection', () => {
            const selection: ExplicitSelection<CalendarTimeSelection> = {
                state: 'cleared',
            };

            expect(
                reconcileTimeFilter({
                    aiTimeOfDay: ['EVENING'],
                    selection,
                    resolution: 'selection',
                }),
            ).toEqual({
                intervals: undefined,
            });
        });

        it('should retain the AI restriction when a cleared selection is resolved as ai', () => {
            const selection: ExplicitSelection<CalendarTimeSelection> = {
                state: 'cleared',
            };

            expect(
                reconcileTimeFilter({
                    aiTimeOfDay: ['EVENING'],
                    selection,
                    resolution: 'ai',
                }),
            ).toEqual({
                intervals: [
                    { startMinute: 1020, endMinute: 1260 },
                ],
            });
        });
    });
});
