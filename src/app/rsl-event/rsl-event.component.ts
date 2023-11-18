import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonText,
  ToastController,
} from '@ionic/angular/standalone';
import { RSLEvent, RSLOccurrence } from '../data/models';
import { CommonModule } from '@angular/common';
import { FavoritesService } from '../favs/favorites.service';
import { addIcons } from 'ionicons';
import { car, star, starOutline } from 'ionicons/icons';

export interface ArtCarEvent {
  event: Event;
  artCar: string;
}

@Component({
  selector: 'app-rsl-event',
  templateUrl: './rsl-event.component.html',
  styleUrls: ['./rsl-event.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonIcon, IonText],
})
export class RslEventComponent {
  @Input() event!: RSLEvent;
  @Output() mapClick = new EventEmitter<RSLEvent>();
  @Output() artCarClick = new EventEmitter<ArtCarEvent>();

  constructor(
    private fav: FavoritesService,
    private toast: ToastController,
  ) {
    addIcons({ car, star, starOutline });
  }

  public map(event: RSLEvent) {
    this.mapClick.emit(event);
  }

  public async toggleStar(occurrence: RSLOccurrence) {
    occurrence.star = !occurrence.star;
    const message = await this.fav.starRSLEvent(occurrence.star, this.event, occurrence);
    if (message) {
      this.presentToast(message, 'bottom');
    }
  }

  public carClick(e: Event) {
    this.artCarClick.emit({ event: e, artCar: this.event.artCar! });
  }

  private async presentToast(message: string, position: any) {
    const toast = await this.toast.create({
      message,
      color: 'primary',
      duration: message.length * 80,
      position: position,
    });
    await toast.present();
  }

  public wheelchair() {
    if (this.event.wa) {
      this.presentToast('This camp is wheelchair accessible. ' + this.event.waNotes, 'top');
    } else {
      if (this.event.waNotes) {
        this.presentToast(this.event.waNotes, 'top');
      } else {
        this.presentToast('This camp may not be wheelchair accessible. They did not provide information.', 'top');
      }
    }
  }
}
