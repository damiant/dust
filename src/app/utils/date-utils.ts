import { addDays, isAfter } from "./utils";

export function daysHighlighted(start: string, end: string): any[] {
    const result: any[] = [];
    let day = new Date(start);
    const endDate = new Date(end);
    while (!isAfter(day, endDate)) {
        const dayStr = day.toISOString().substring(0, 10);
        result.push({ date: dayStr, textColor: 'var(--ion-color-primary)' });
        day = addDays(day, 1);
    }
    return result;
}