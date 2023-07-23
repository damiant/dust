import { CommonModule } from '@angular/common';
import { Component, EnvironmentInjector, OnInit, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DbService } from '../db.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class TabsPage implements OnInit {
  ready = false;
  public environmentInjector = inject(EnvironmentInjector);

  constructor(private db: DbService) {}

  async ngOnInit() {
    await this.db.init();
    this.ready = true;
  }
}
