import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Camp } from '../models';
import { DbService } from '../db.service';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-camps',
  templateUrl: 'camps.page.html',
  styleUrls: ['camps.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, ScrollingModule]
})
export class CampsPage {
  camps: Camp[] = [];

  constructor(private db: DbService) { }

  async ionViewDidEnter() {    
    this.camps = await this.db.getCamps(0, 9999);
  }

  handleInput(event: any) {
    this.update(event.target.value.toLowerCase());
  }

  campsTrackBy(index: number, camp: Camp) {
    return camp.uid;
  }

  async update(search: string) {
    this.camps = await this.db.findCamps(search);    
  }
}
