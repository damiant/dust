import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, input, model, output } from '@angular/core';
import { IonButton, IonIcon, IonModal, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';

@Component({
    selector: 'app-message',
    templateUrl: './message.component.html',
    styleUrls: ['./message.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonModal, IonButton, IonText, IonIcon]
})
export class MessageComponent {
  public show = model(false);
  private _change = inject(ChangeDetectorRef);
  public secondButton = input('');

  message = input('');
  title = input('');
  buttonLabel = input('Continue');
  disabled = false;
  dismissed = output<boolean>();
  constructor() {
    addIcons({ arrowForwardOutline });
    effect(() => {
      const show = this.show();
      if (show) {
        this.disabled = true;
        setTimeout(() => {
          this.disabled = false;
          this._change.detectChanges();
        }, 500);
      }
    })
  }

  close() {
    if (this.disabled) return;
    this.show.set(false);
  }

  dismiss(okPressed: boolean) {
    this.close();
    this.dismissed.emit(okPressed);
  }
}
