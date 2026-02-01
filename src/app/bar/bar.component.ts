import { Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { albumsOutline, listOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss'],
  imports: [CommonModule],
})
export class BarComponent {
  opened = input(false);

  options = [
    { id: 'past', name: 'Past' },
    { id: 'all', name: 'Upcoming' },
    { id: 'bm', name: `)'(` },
  ];
  selection = model(this.options[1].id);
  selected = output<string>();

  constructor() {
    addIcons({ albumsOutline, listOutline });
  }

  update(id: string) {
    this.selection.set(id);
    this.selected.emit(id);
  }
}
