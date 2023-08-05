import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { Keyboard } from '@capacitor/keyboard';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule]
})
export class SearchComponent implements OnInit {

  @Input() placeholder = '';
  @Output() search = new EventEmitter<string>();
  form = new FormGroup({
    search: new FormControl('')
  });
  constructor() { }

  ngOnInit() { }

  onSubmit() {
    if (this.form.value.search) {
      this.search.emit(this.form.value.search);
    }
    Keyboard.hide();
  }

  handleInput(event: any) {
    this.search.emit(event.target.value);
  }

}
