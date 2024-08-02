import { EventEmitter, Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root',
})
export class EventsService {
    public next = new EventEmitter<string>();
    public prev = new EventEmitter<string>();
    public eventChanged = new EventEmitter<string>();
}