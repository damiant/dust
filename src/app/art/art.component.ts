import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Art } from '../data/models';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonText,
} from '@ionic/angular/standalone';
import { CacheImageComponent } from '../cache-image/cache-image.component';

@Component({
  selector: 'app-art',
  templateUrl: './art.component.html',
  styleUrls: ['./art.component.scss'],
  standalone: true,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    CacheImageComponent, IonText],
})
export class ArtComponent {
  @Input() art!: Art;
  @Input() title = 'Art';
  @Input() showImage = true;
  @Output() artClick = new EventEmitter<Art>();

  click() {
    this.artClick.emit(this.art);
  }
}
