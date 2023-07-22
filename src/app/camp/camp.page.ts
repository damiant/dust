import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { DbService } from '../db.service';
import { Camp } from '../models';

@Component({
  selector: 'app-camp',
  templateUrl: './camp.page.html',
  styleUrls: ['./camp.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CampPage implements OnInit {

  camp: Camp | undefined;
  constructor(private route: ActivatedRoute, private db: DbService) {     
  }

  async ngOnInit() {
    const tmp = this.route.snapshot.paramMap.get('id')?.split('+');
    if (!tmp) throw new Error('Route error');
    const id = tmp[0];
    this.camp = await this.db.findCamp(id);
    console.log(this.camp);
  }

}
