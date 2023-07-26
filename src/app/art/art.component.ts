import { Component, Input, OnInit } from '@angular/core';
import { Art } from '../models';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-art',
  templateUrl: './art.component.html',
  styleUrls: ['./art.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule]
})
export class ArtComponent implements OnInit {

  @Input() art!: Art;
  @Input() title = 'Art';
  constructor() { }

  ngOnInit() { }

}
