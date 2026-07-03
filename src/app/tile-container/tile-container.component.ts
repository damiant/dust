import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-tile-container',
  templateUrl: './tile-container.component.html',
  styleUrls: ['./tile-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
export class TileContainerComponent {}
