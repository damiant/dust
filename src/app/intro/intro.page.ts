import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { DbService } from '../db.service';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.page.html',
  styleUrls: ['./intro.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class IntroPage implements OnInit {
  ready = false;;
  constructor(private db: DbService) { }

  async ngOnInit() {
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 100);
    await this.db.init();
    this.ready = true;
  }

}
