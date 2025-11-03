import { inject, Injectable } from '@angular/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { ToastController } from '@ionic/angular/standalone';
import { FavoritesService } from '../favs/favorites.service';
import { DbService } from './db.service';
import { delay } from '../utils/utils';

export interface BurnPlannerData {
  events: Event[];
  art: Art[];
}

export interface Event {
  uid: string;
  event_type: EventType;
  check_location: number;
  description: string;
  compass_id: number;
  rating: number;
  event_id: number;
  print_description: string;
  location_name: any;
  minutes: number;
  slug: string;
  hosted_by_camp?: string;
  adult: boolean;
  occurrence_set: OccurrenceSet[];
  title: string;
  votes: number;
  timestamp: string;
  vote_count: number;
  my_rating: number;
  contact?: string;
  located_at_art?: string;
}

export interface EventType {
  abbr: string;
  id: number;
  label: string;
}

export interface OccurrenceSet {
  start_time: string;
  end_time: string;
}

export interface Art {
  year: number;
  uid: string;
  description: string;
  artist: string;
  url?: string;
  compass_id: number;
  rating: number;
  hometown: string;
  images: Image[];
  contact_email?: string;
  name: string;
  guided_tours: number;
  category: string;
  program: string;
  votes: number;
  self_guided_tour_map: number;
  donation_link?: string;
  timestamp: string;
  vote_count: number;
  my_rating: number;
}

export interface Image {
  gallery_ref: any;
  thumbnail_url: string;
}

@Injectable({
  providedIn: 'root',
})
export class BurnPlannerService {
  private toastController = inject(ToastController);
  private favs = inject(FavoritesService);
  private db = inject(DbService);
  public async import(path: string | undefined): Promise<void> {
    if (!path) {
      console.error('No path provided for Burn Planner import');
      return;
    }
    const url = decodeURIComponent(path);
    this.presentToast(`Importing Burn Planner Events...`);
    const data = await this.getData(url);
    if (!data?.events) {
      console.error('No events found in Burn Planner data', data);
      return;
    }
    let count = 0;
    for (const ev of data.events) {
      if (ev.hosted_by_camp) {
        // Look up event with title hosted by camp and favorite it
        const list = await this.db.findEventsByCamp(ev.hosted_by_camp, ev.title);
        for (const event of list) {
          await this.favs.starEvent(true, event, this.db.selectedDay(), undefined, true);
          await delay(500);
          count++;
        }
      }
    }
    this.presentToast(`${count} events favorited from Burn Planner.`);
  }

  private async getData(url: string): Promise<BurnPlannerData | undefined> {
    const options = {
      url,
      headers: {
        Accept: 'application/json',
      },
      readTimeout: 30000,
    };
    try {
      const response: HttpResponse = await CapacitorHttp.get(options);
      if (response.status !== 200) {
        this.presentToast(`Burn Planner returned ${response.status} from ${url}`);
        return undefined;
      }
      return await response.data;
    } catch {
      this.presentToast('Failed to get Burn Planner data from ' + url);
      return undefined;
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      color: 'primary',
      duration: 2500,
      swipeGesture: 'vertical',
      position: 'bottom',
    });

    await toast.present();
  }
}
