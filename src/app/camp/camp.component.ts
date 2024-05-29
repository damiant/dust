import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Camp } from '../data/models';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonText,
} from '@ionic/angular/standalone';
import { CachedImgComponent } from '../cached-img/cached-img.component';

@Component({
  selector: 'app-camp',
  templateUrl: './camp.component.html',
  styleUrls: ['./camp.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonText,
    IonCardTitle,
    IonCardContent,
    CachedImgComponent,
  ],
})
export class CampComponent {
  camp = input.required<Camp>();
  title = input('Camps');
  mapClick = output<any>();

  map(camp: Camp, ev: any) {
    console.log('emit', camp);
    this.mapClick.emit(camp);
    ev.stopPropagation();
  }
}
