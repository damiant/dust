import { Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { albumsOutline, listOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss'],
  animations: [
    trigger('openClose', [
      state('true', style({transform: 'translateY(0)', opacity: 1})),
      state('false', style({transform: 'translateY(50px)', opacity: 0})),
      transition('false => true', [animate('200ms ease-out')]),
      transition('true => false', [animate('200ms ease-in')])      
    ]),
  ],
  imports: [
    CommonModule
  ]
})
export class BarComponent {
  opened = input(false);

  options = [
    { id: 'past', name: 'Past' },
    { id: 'all', name: 'Upcoming' },
    { id: 'bm', name: `)'(` }
  ];
  selection = model(this.options[1].id);
  selected = output<string>();

  constructor() {
    addIcons({ albumsOutline, listOutline })
  }

  update(id: string) {
    this.selection.set(id);
    this.selected.emit(id);
  }
}
