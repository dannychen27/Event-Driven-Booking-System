export type Weekday =
    | 'MONDAY'
    | 'TUESDAY'
    | 'WEDNESDAY'
    | 'THURSDAY'
    | 'FRIDAY'
    | 'SATURDAY'
    | 'SUNDAY';

export type RelativeDateRange =
    | { kind: 'TODAY' }
    | { kind: 'TOMORROW' }
    | { kind: 'YESTERDAY' }
    | { kind: 'THIS_WEEKEND' }
    | { kind: 'NEXT_WEEKEND' }
    | { kind: 'DAYS_FROM_NOW'; days: number }
    | { kind: 'DAYS_AGO'; days: number }
    | {
    kind: 'WEEKDAY';
    weekday: Weekday;
    occurrence: 'THIS' | 'NEXT' | 'LAST';
}
    | { kind: 'NEXT_BUSINESS_DAY' }
    | { kind: 'PREVIOUS_BUSINESS_DAY' }
    | { kind: 'BUSINESS_DAYS_FROM_NOW'; days: number }
    | { kind: 'BUSINESS_DAYS_AGO'; days: number };
