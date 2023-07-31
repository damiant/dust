import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule } from '@ionic/angular';
import { UiService } from '../ui.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit {

  constructor(private ui: UiService, private alertController: AlertController) { }

  ngOnInit() {
  }

  home() {
    this.ui.home();
  }

  async unimplemented() {
    const alert = await this.alertController.create({
      header: 'Under Development',      
      message: 'This feature is currently being worked on.',
      buttons: ['OK'],
    });

    await alert.present();
  }

}
