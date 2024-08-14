import { EventEmitter, Injectable, signal } from "@angular/core";

export type EventPositionChange = 'start' | 'end' | 'middle' | 'unknown';
export interface EventChanged {
    eventId: string;
}
@Injectable({
    providedIn: 'root',
})
export class EventsService {
    public next = new EventEmitter<string>();
    public prev = new EventEmitter<string>();
    public position = signal<EventPositionChange>('unknown');
    public eventChanged = new EventEmitter<EventChanged>();
}