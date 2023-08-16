import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { RSLEvent, RSLOccurrence } from '../data/models';
import { CommonModule } from '@angular/common';
import { FavoritesService } from '../favs/favorites.service';

@Component({
  selector: 'app-rsl-event',
  templateUrl: './rsl-event.component.html',
  styleUrls: ['./rsl-event.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, CommonModule]
})
export class RslEventComponent implements OnInit {

  @Input() event!: RSLEvent;
  @Output() mapClick = new EventEmitter<RSLEvent>();

  constructor(private fav: FavoritesService, private toast: ToastController) { }

  ngOnInit() { }

  public map(event: RSLEvent) {
    this.mapClick.emit(event);
  }

  public async toggleStar(occurrence: RSLOccurrence) {
    occurrence.star = !occurrence.star;
    const message = await this.fav.starRSLEvent(occurrence.star, this.event, occurrence);
    if (message) {
      this.presentToast(message);
    }
  }

  private async presentToast(message: string) {
    const toast = await this.toast.create({
      message,
      color: 'primary',
      duration: 3000,
      position: 'bottom',
    });
    await toast.present();
  }

}
