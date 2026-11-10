export const EVENT_RANKING_SCHEMA = {
  type: 'OBJECT',
  properties: {
    eventIds: {
      type: 'ARRAY',
      items: { type: 'INTEGER' },
    },
  },
  required: ['eventIds'],
  propertyOrdering: ['eventIds'],
};

export const NATURAL_LANGUAGE_SEARCH_SCHEMA = {
  type: 'OBJECT',
  properties: {
    intent: { type: 'STRING' },
    startAfter: { type: 'STRING' },
    startBefore: { type: 'STRING' },
    relativeDate: {
      type: 'OBJECT',
      properties: {
        kind: {
          type: 'STRING',
          enum: [
            'TODAY',
            'TOMORROW',
            'YESTERDAY',
            'THIS_WEEK',
            'NEXT_WEEK',
            'LAST_WEEK',
            'THIS_WEEKEND',
            'NEXT_WEEKEND',
            'DAYS_FROM_NOW',
            'DAYS_AGO',
            'WEEKDAY',
            'NEXT_BUSINESS_DAY',
            'PREVIOUS_BUSINESS_DAY',
            'BUSINESS_DAYS_FROM_NOW',
            'BUSINESS_DAYS_AGO',
          ],
        },
        days: { type: 'INTEGER' },
        weekday: {
          type: 'STRING',
          enum: [
            'MONDAY',
            'TUESDAY',
            'WEDNESDAY',
            'THURSDAY',
            'FRIDAY',
            'SATURDAY',
            'SUNDAY',
          ],
        },
        occurrence: {
          type: 'STRING',
          enum: ['THIS', 'NEXT', 'LAST'],
        },
      },
      required: ['kind'],
    },
    includePastEvents: { type: 'BOOLEAN' },
    includeFutureEvents: { type: 'BOOLEAN' },
    timeOfDay: {
      type: 'STRING',
      enum: [
        'EARLY_MORNING',
        'MORNING',
        'AFTERNOON',
        'EVENING',
        'NIGHT',
      ],
    },
    timeRange: {
      type: 'OBJECT',
      properties: {
        startTime: { type: 'STRING' },
        endTime: { type: 'STRING' },
      },
      propertyOrdering: ['startTime', 'endTime'],
    },
  },
  propertyOrdering: [
    'intent',
    'startAfter',
    'startBefore',
    'relativeDate',
    'includePastEvents',
    'includeFutureEvents',
    'timeOfDay',
    'timeRange',
  ],
};
