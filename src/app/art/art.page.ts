import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Art } from '../models';
import { DbService } from '../db.service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-art',
  templateUrl: 'art.page.html',
  styleUrls: ['art.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterLink, CommonModule ],
})
export class ArtPage {
  arts: Art[] = [];

  constructor(private db: DbService) { }

  async ionViewDidEnter() {
    await this.db.init();
    this.update(undefined);
  }

  handleInput(event: any) {
    this.update(event.target.value.toLowerCase());
  }

  async update(search: string | undefined) {
    this.arts = await this.db.findArts(search);
  }
}
