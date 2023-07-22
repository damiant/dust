import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Camp } from '../models';
import { DbService } from '../db.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-camps',
  templateUrl: 'camps.page.html',
  styleUrls: ['camps.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule]
})
export class CampsPage {
  camps: Camp[] = [];

  constructor(private db: DbService) { }

  async ionViewDidEnter() {
    await this.db.init();
    this.camps = await this.db.getCamps(0, 9999);
    console.log(this.camps);
  }

  handleInput(event: any) {
    this.update(event.target.value.toLowerCase());
  }

  async update(search: string) {
    this.camps = await this.db.findCamps(search);    
    console.log(`${this.camps.length} camps`);
  }
}
