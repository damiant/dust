import { NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonButton, IonContent, IonIcon, IonPopover, IonRadio, IonRadioGroup } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDown } from 'ionicons/icons';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
  standalone: true,
  imports: [NgFor, IonButton, IonPopover, IonContent, IonRadioGroup, IonRadio, IonIcon]
})
export class CategoryComponent {
  @Input() id = '';
  @Input() allTitle: string = '';
  @Input() category: string = '';
  @Input() categories: string[] = [];
  @Output() categoryChange = new EventEmitter<string>();
  @Output() change = new EventEmitter<string>();
  constructor() {
    addIcons({ chevronDown });
   }


  changed(e: any) {
    this.category = e.detail.value;
    this.categoryChange.emit(this.category);
    this.change.emit(this.category);
  }

}
