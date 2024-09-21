import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Art } from '../data/models';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonText,
} from '@ionic/angular/standalone';
import { CachedImgComponent } from '../cached-img/cached-img.component';
import { addIcons } from 'ionicons';
import { volumeHighOutline } from 'ionicons/icons';

export type ArtImageStyle = 'top' | 'side' | 'none';

@Component({
  selector: 'app-art',
  templateUrl: './art.component.html',
  styleUrls: ['./art.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    CachedImgComponent,
    IonText,
    IonIcon,
  ],
})
export class ArtComponent {
  art = input.required<Art>();
  title = input('Art');
  imageStyle = input<ArtImageStyle>('top');
  imageContainerCSSStyle = computed(() => this.imageStyle() == 'top' ? 'image-container' : 'side-container');
  imageCSSStyle = computed(() => this.imageStyle() == 'top' ? 'image' : 'side-image');
  artClick = output<Art>();

  constructor() {
    addIcons({ volumeHighOutline });
  }

  click() {
    this.artClick.emit(this.art());
  }
}
