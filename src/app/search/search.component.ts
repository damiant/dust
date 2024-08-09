import { Component, input, OnInit, output, viewChild } from '@angular/core';
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
export class SearchComponent implements OnInit {
  placeholder = input('');
  openFocused = input(false);
  search = output<string>();
  searchBar = viewChild.required(IonSearchbar)

  form = new FormGroup({
    search: new FormControl(''),
  });

  ngOnInit(): void {
    if (this.openFocused()) {
      setTimeout(() => {
        this.searchBar().setFocus();
      }, 500);
    }
  }

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
