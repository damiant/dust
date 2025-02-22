import { Injectable } from "@angular/core";
import { CapacitorHttp, HttpResponse } from '@capacitor/core';

export interface Shifts {
    email: string;
    shifts: Shift[];
}

export interface Shift {
    startDate: string;
    endDate: string;
    location: string;
}

@Injectable({
    providedIn: 'root',
})
export class VolunteeripateService {

    url(): string {
        return `tothemoonburn.volunteeripate.com`;
    }

    async signIn(): Promise<void> {
        const redirectUrl = `https://dust.events/?volunteeripate`;
        const url = `https://${this.url()}/?dust_redirect=${encodeURIComponent(redirectUrl)}`;
        window.open(url, '_blank');
    }

    async getShifts(token: string): Promise<Shifts> {
        const url = `https://${this.url()}/shift_data?dust_id=to-the-moon-24`;
        try {
            const options = { url, headers: {
                 'Authorization': 'Bearer ' + token,
                 'Content-Type': 'application/json'
                 } };
            console.log(`Called volunteeripate ${url} with token "${token}"`);
            const response: HttpResponse = await CapacitorHttp.post(options);
            if (response.status !== 200) {
                alert(`Failed to get shifts`);
            } else {
                const data = await response.data;
                console.log(data);
            }
        } catch (e) {
            alert(e);
            return { email: '', shifts: [] };
        }
        return { email: '', shifts: [] };
    }
}