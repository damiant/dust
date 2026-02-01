import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [class.pad-right]="padRight()"><ng-content></ng-content></span>`,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: var(--ion-color-primary, #3880ff);
      color: white;
      border-radius: 10px;
      padding: 0.2em 0.5em;
      font-size: 0.75rem;
      font-weight: 600;
      min-width: 1.25rem;
      min-height: 1.25rem;
      line-height: 1;
      white-space: nowrap;
    }

    .badge.pad-right {
      margin-right: 0.8rem;
    }
  `]
})
export class BadgeComponent {
  padRight = input(false);
}
