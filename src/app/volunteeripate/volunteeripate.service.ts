import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';

export interface Shift {
  shift_end: number;
  shift_title: string;
  shift_location: string;
  shift_description: string;
  shift_start: number; // Eg 1719079200
  department_title: string;
  dust_id: string; // Eg to-the-moon-24
}

@Injectable({
  providedIn: 'root',
})
export class VolunteeripateService {
  url(subdomain: string): string {
    return `${subdomain}.volunteeripate.com`;
  }

  async signIn(subdomain: string): Promise<void> {
    const redirectUrl = `https://dust.events/volunteeripate${Math.random()}`;
    const url = `https://${this.url(subdomain)}/?dust_redirect=${encodeURIComponent(redirectUrl)}`;
    window.open(url, '_blank');
  }

  async getShifts(subdomain: string, token: string): Promise<Shift[]> {
    const url = `https://${this.url(subdomain)}/shift_data.json`; //?dust_id=to-the-moon-24
    try {
      const options = {
        url,
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
      };
      console.log(`Called volunteeripate ${url} with token "${token}"`);
      const response: HttpResponse = await CapacitorHttp.post(options);
      if (response.status !== 200) {
        alert(`Failed to get shifts`);
      } else {
        const data = await response.data;
        if (data.error) {
          alert(data.error);
          return [];
        }
        const shifts: Shift[] = data;
        console.log(`Received shifts`, shifts);
        return shifts;
      }
    } catch (e) {
      alert(e);
      return [];
    }
    return [];
  }
}
