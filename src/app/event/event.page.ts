import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DbService } from '../db.service';
import { Event } from '../models';

@Component({
  selector: 'app-event',
  templateUrl: './event.page.html',
  styleUrls: ['./event.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class EventPage implements OnInit {
  public event: Event | undefined;
  public back = signal('Back');

  constructor(private route: ActivatedRoute, private db: DbService) {     
  }

  async ngOnInit() {
    const tmp = this.route.snapshot.paramMap.get('id')?.split('+');
    if (!tmp) throw new Error('Route error');
    const id = tmp[0];
    this.back.set(tmp[1]);
    this.event = await this.db.findEvent(id);
    console.log(this.event);
  }

}
