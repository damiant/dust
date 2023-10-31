import { Injectable } from '@angular/core';
import { Event, NavigationEnd, Router, RouterEvent } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { ScreenReader } from '@capacitor/screen-reader';
import { filter } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RouterFocusService {
    constructor(private router: Router) {
    }

    public init() {
        this.router.events.subscribe((event: RouterEvent | Event) => this.focusFirst(event));
    }

    private async focusFirst(event: RouterEvent | Event) {
        if (!(event instanceof NavigationEnd)) return;
        if (!ScreenReader.isEnabled()) return;        

        // Animation happens
        await this.delay(700);

        // This prevents reading of previously focused element
        // if (Capacitor.isNativePlatform()) {
        //     await ScreenReader.speak({ value: '	 ' });
        // }

        // We look for an element on an ion-content that we want to focus
        const all = document.getElementsByClassName('page-focus');





        // This can return more than one page
        const pages = document.querySelectorAll('.ion-page:not(.ion-page-hidden, .ion-page:has(ion-tabs))');
        let page: Element | undefined;
        pages.forEach((e) => {
            page = e;
        });

        const e: Element | undefined | null = page?.querySelector('.page-focus');        

        if (!e) {
            console.log(`element not found on ${page?.tagName}`);
            return;
        }


        // We need to set tabindex to -1 and focus the element for the screen reader to read what we want
        (e as HTMLElement).setAttribute('tabindex', '-1');

        if (Capacitor.isNativePlatform()) {
            // This will prevent the visual change for keyboard
            (e as HTMLElement).setAttribute('outline', 'none');
        }

        console.log(`Focusing element ${e.tagName} on ${page?.tagName}`);
        (e as HTMLElement).focus();
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve =>
            setTimeout(resolve, ms)
        );
    }

    private getVisible(el: HTMLElement): boolean {
        // look for parent elements with class ion-page and see if ion-page-hidden class is present
        let e: any = el;
        while (e) {
            if (e.classList.contains('ion-page')) {
                return !e.classList.contains('ion-page-hidden');
            }
            e = e.parentElement;
        }
        return false;
    }
}