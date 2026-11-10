import { BadRequestException } from '@nestjs/common';

import {
    validateNaturalLanguageSearchRequest,
} from '../../../4. backend/src/search/natural-language-search-request.validation';

describe('validateNaturalLanguageSearchRequest', () => {
    describe('valid requests', () => {
        it('should accept a query-only request and trim the query', () => {
            expect(validateNaturalLanguageSearchRequest({
                query: '  live music  ',
            })).toEqual({
                query: 'live music',
            });
        });

        it('should accept a selected date range without a query', () => {
            expect(validateNaturalLanguageSearchRequest({
                filters: {
                    date: {
                        state: 'selected',
                        value: {
                            startDate: '2026-11-10',
                            endDate: '2026-11-12',
                        },
                    },
                },
            })).toEqual({
                filters: {
                    date: {
                        state: 'selected',
                        value: {
                            startDate: '2026-11-10',
                            endDate: '2026-11-12',
                        },
                    },
                },
            });
        });

        it('should accept a selected time-of-day filter without a query', () => {
            expect(validateNaturalLanguageSearchRequest({
                filters: {
                    time: {
                        state: 'selected',
                        value: {
                            timeOfDay: ['EVENING'],
                        },
                    },
                },
            })).toEqual({
                filters: {
                    time: {
                        state: 'selected',
                        value: {
                            timeOfDay: ['EVENING'],
                        },
                    },
                },
            });
        });

        it('should accept an explicit time range', () => {
            expect(validateNaturalLanguageSearchRequest({
                query: 'concerts',
                filters: {
                    time: {
                        state: 'selected',
                        value: {
                            timeRange: {
                                startTime: '18:00',
                                endTime: '20:00',
                            },
                        },
                    },
                },
            })).toEqual({
                query: 'concerts',
                filters: {
                    time: {
                        state: 'selected',
                        value: {
                            timeRange: {
                                startTime: '18:00',
                                endTime: '20:00',
                            },
                        },
                    },
                },
            });
        });

        it('should accept a leap-day date range', () => {
            expect(validateNaturalLanguageSearchRequest({
                filters: {
                    date: {
                        state: 'selected',
                        value: {
                            startDate: '2028-02-29',
                            endDate: '2028-02-29',
                        },
                    },
                },
            })).toBeDefined();
        });

        it('should accept a single-day date range', () => {
            expect(validateNaturalLanguageSearchRequest({
                filters: {
                    date: {
                        state: 'selected',
                        value: {
                            startDate: '2026-11-10',
                            endDate: '2026-11-10',
                        },
                    },
                },
            })).toBeDefined();
        });

        it('should accept combined query, date, and time selections', () => {
            expect(validateNaturalLanguageSearchRequest({
                query: 'music events',
                filters: {
                    date: {
                        state: 'selected',
                        value: {
                            startDate: '2026-11-10',
                            endDate: '2026-11-12',
                        },
                    },
                    time: {
                        state: 'selected',
                        value: {
                            timeOfDay: ['EVENING'],
                            timeRange: {
                                startTime: '18:00',
                                endTime: '20:00',
                            },
                        },
                    },
                },
            })).toBeDefined();
        });

        it('should accept an explicitly cleared date alongside a query', () => {
            expect(validateNaturalLanguageSearchRequest({
                query: 'events tomorrow',
                filters: {
                    date: {
                        state: 'cleared',
                    },
                },
            })).toEqual({
                query: 'events tomorrow',
                filters: {
                    date: {
                        state: 'cleared',
                    },
                },
            });
        });

        it('should accept a cleared filter alongside another selected filter', () => {
            expect(validateNaturalLanguageSearchRequest({
                filters: {
                    date: {
                        state: 'cleared',
                    },
                    time: {
                        state: 'selected',
                        value: {
                            timeOfDay: ['EVENING'],
                        },
                    },
                },
            })).toBeDefined();
        });

        it('should accept valid resolutions with a query and explicit selections', () => {
            expect(validateNaturalLanguageSearchRequest({
                query: 'events tomorrow evening',
                filters: {
                    date: {
                        state: 'selected',
                        value: {
                            startDate: '2026-11-10',
                            endDate: '2026-11-10',
                        },
                    },
                    time: {
                        state: 'cleared',
                    },
                },
                resolutions: {
                    date: 'ai',
                    time: 'selection',
                },
            })).toBeDefined();
        });

        it('should accept multiple selected time-of-day periods', () => {
            expect(validateNaturalLanguageSearchRequest({
                filters: {
                    time: {
                        state: 'selected',
                        value: {
                            timeOfDay: ['MORNING', 'EVENING'],
                        },
                    },
                },
            })).toMatchObject({
                filters: {
                    time: {
                        state: 'selected',
                        value: {
                            timeOfDay: ['MORNING', 'EVENING'],
                        },
                    },
                },
            });
        });
    });

    describe('invalid requests', () => {
        it('should reject a non-object request', () => {
            expect(() => validateNaturalLanguageSearchRequest(null))
                .toThrow(BadRequestException);
        });

        it('should reject an array request', () => {
            expect(() => validateNaturalLanguageSearchRequest([]))
                .toThrow(BadRequestException);
        });

        it('should reject an empty request', () => {
            expect(() => validateNaturalLanguageSearchRequest({}))
                .toThrow(BadRequestException);
        });

        it('should reject a blank query', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                query: '   ',
            })).toThrow(BadRequestException);
        });

        it('should reject an unsupported root field', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                query: 'concerts',
                sql: 'DROP TABLE events',
            })).toThrow(BadRequestException);
        });

        it('should reject cleared-only filters without a query', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                filters: {
                    date: {
                        state: 'cleared',
                    },
                },
            })).toThrow(BadRequestException);
        });

        it('should reject an empty filters object without a query', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                filters: {},
            })).toThrow(BadRequestException);
        });

        it('should reject an impossible calendar date', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                filters: {
                    date: {
                        state: 'selected',
                        value: {
                            startDate: '2026-02-30',
                            endDate: '2026-03-01',
                        },
                    },
                },
            })).toThrow(BadRequestException);
        });

        it('should reject an incorrectly formatted calendar date', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                filters: {
                    date: {
                        state: 'selected',
                        value: {
                            startDate: '11/10/2026',
                            endDate: '2026-11-12',
                        },
                    },
                },
            })).toThrow(BadRequestException);
        });

        it('should reject an end date earlier than the start date', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                filters: {
                    date: {
                        state: 'selected',
                        value: {
                            startDate: '2026-11-12',
                            endDate: '2026-11-10',
                        },
                    },
                },
            })).toThrow(BadRequestException);
        });

        it('should reject a date selection missing an end date', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                query: 'events',
                filters: {
                    date: {
                        state: 'selected',
                        value: {
                            startDate: '2026-11-10',
                        },
                    },
                },
            })).toThrow(BadRequestException);
        });

        it('should reject an unsupported nested date field', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                query: 'events',
                filters: {
                    date: {
                        state: 'selected',
                        value: {
                            startDate: '2026-11-10',
                            endDate: '2026-11-12',
                            timezone: 'UTC',
                        },
                    },
                },
            })).toThrow(BadRequestException);
        });

        it('should reject an empty selected time filter', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                query: 'events',
                filters: {
                    time: {
                        state: 'selected',
                        value: {},
                    },
                },
            })).toThrow(BadRequestException);
        });

        it('should reject an invalid time range', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                query: 'events',
                filters: {
                    time: {
                        state: 'selected',
                        value: {
                            timeRange: {
                                startTime: '25:00',
                                endTime: '26:00',
                            },
                        },
                    },
                },
            })).toThrow(BadRequestException);
        });

        it('should reject identical time-range boundaries', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                query: 'events',
                filters: {
                    time: {
                        state: 'selected',
                        value: {
                            timeRange: {
                                startTime: '18:00',
                                endTime: '18:00',
                            },
                        },
                    },
                },
            })).toThrow(BadRequestException);
        });

        it('should reject a cleared selection containing a value', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                query: 'events',
                filters: {
                    date: {
                        state: 'cleared',
                        value: {
                            startDate: '2026-11-10',
                            endDate: '2026-11-12',
                        },
                    },
                },
            })).toThrow(BadRequestException);
        });

        it('should reject a selected date without a value', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                query: 'events',
                filters: {
                    date: {
                        state: 'selected',
                    },
                },
            })).toThrow(BadRequestException);
        });

        it('should reject an unsupported selection state', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                query: 'events',
                filters: {
                    date: {
                        state: 'untouched',
                    },
                },
            })).toThrow(BadRequestException);
        });

        it('should reject an unsupported filter category', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                query: 'events',
                filters: {
                    location: {
                        state: 'cleared',
                    },
                },
            })).toThrow(BadRequestException);
        });

        it('should reject a resolution without a matching explicit selection', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                query: 'events tomorrow',
                resolutions: {
                    date: 'ai',
                },
            })).toThrow(BadRequestException);
        });

        it('should reject an unsupported resolution value', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                query: 'events tomorrow',
                filters: {
                    date: {
                        state: 'cleared',
                    },
                },
                resolutions: {
                    date: 'calendar',
                },
            })).toThrow(BadRequestException);
        });

        it('should reject resolutions without a query', () => {
            expect(() => validateNaturalLanguageSearchRequest({
                filters: {
                    date: {
                        state: 'selected',
                        value: {
                            startDate: '2026-11-10',
                            endDate: '2026-11-10',
                        },
                    },
                },
                resolutions: {
                    date: 'selection',
                },
            })).toThrow(BadRequestException);
        });
    });
});
