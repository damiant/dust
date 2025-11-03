import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Camp } from '../data/models';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
  router = inject(Router);

  openCamp() {
    this.router.navigate(['/camp/' + this.camp().uid + '+' + this.title()]);
  }

  map(camp: Camp, ev: any) {
    this.mapClick.emit(camp);
    ev.stopPropagation();
  }
}
