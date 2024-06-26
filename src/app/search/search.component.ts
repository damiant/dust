import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { IonSearchbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, IonSearchbar],
})
export class SearchComponent {
  placeholder = input('');
  search = output<string>();
  form = new FormGroup({
    search: new FormControl(''),
  });

  onSubmit() {
    if (this.form.value.search) {
      this.search.emit(this.form.value.search);
    }
    if (Capacitor.getPlatform() != 'web') {
      Keyboard.hide();
    }
  }

  handleInput(event: any) {
    this.search.emit(event.target.value);
  }
}
