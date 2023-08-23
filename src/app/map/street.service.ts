import { Injectable } from '@angular/core';
import { PickerColumn, PickerColumnOption } from '@ionic/angular';
import { PickerColumnItem } from '@ionic/core';

@Injectable({
  providedIn: 'root'
})
export class StreetService {

  private allStreets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'Esplanade', 'Center Camp'];
  private allHours = ['2', '3', '4', '5', '6', '7', '8', '9', '10'];
  private allMinutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  constructor() { }

  public getAddresses(): PickerColumn[] {
    const streets: Array<PickerColumnItem> = [];
    for (let street of this.allStreets) {
      streets.push({ text: street, value: street });
    }

    const hours: Array<PickerColumnItem> = [];
    for (let hour of this.allHours) {
      hours.push({ text: hour, value: hour });
    }

    const minutes: Array<PickerColumnItem> = [];
    for (let minute of this.allMinutes) {
      minutes.push({ text: minute, value: minute });
    }

    return [
      { name: 'hour', options: hours },
      { name: 'minute', options: minutes },
      { name: 'street', options: streets },
    ];
  }

  public setAddress(address: string, addresses: PickerColumn[]) {
    const t = address.split('&');
    try {
      const street = t[1].trim();
      const t2 = t[0].split(':');
      const hour = t2[0];
      const minutes = t2[1];
      addresses[0].selectedIndex = this.allHours.indexOf(hour);
      addresses[1].selectedIndex = this.allMinutes.indexOf(minutes);
      addresses[2].selectedIndex = this.allStreets.indexOf(street);
    } catch
    {

    }
  }

  public indexOfHour(hour: string): number {
    return this.allHours.indexOf(hour);
  }

  public indexOfMinutes(hour: string): number {
    return this.allHours.indexOf(hour);
  }
}
