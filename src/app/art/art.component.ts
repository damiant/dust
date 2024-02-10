import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
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
import { CachedImgComponent } from '../cached-img/cached-img.component';

@Component({
  selector: 'app-art',
  templateUrl: './art.component.html',
  styleUrls: ['./art.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,  
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    CachedImgComponent, IonText],
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
