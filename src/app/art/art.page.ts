import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Art } from '../models';
import { DbService } from '../db.service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-art',
  templateUrl: 'art.page.html',
  styleUrls: ['art.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterLink, CommonModule, ScrollingModule],
})
export class ArtPage {
  arts: Art[] = [];

  constructor(private db: DbService) { }

  async ionViewDidEnter() {    
    this.update(undefined);
  }

  handleInput(event: any) {
    this.update(event.target.value.toLowerCase());
  }

  artTrackBy(index: number, art: Art) {
    return art.uid;
  }

  async update(search: string | undefined) {
    this.arts = await this.db.findArts(search);
  }
}
