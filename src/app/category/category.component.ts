import { NgFor } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
  standalone: true,
  imports: [IonicModule, NgFor]
})
export class CategoryComponent implements OnInit {

  @Input() category: string = '';
  @Input() categories: string[] = [];
  @Output() categoryChange = new EventEmitter<string>();
  @Output() change = new EventEmitter<string>();
  constructor() { }

  ngOnInit() { }

  changed(e: any) {
    this.category = e.detail.value;
    this.categoryChange.emit(this.category);
    this.change.emit(this.category);
  }

}
