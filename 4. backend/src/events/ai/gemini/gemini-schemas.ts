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
  },
  propertyOrdering: ['intent', 'startAfter', 'startBefore'],
};
