import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule } from '@ionic/angular';
import { UiService } from '../ui.service';
import { Share } from '@capacitor/share';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit {

  constructor(private ui: UiService, private router: Router, private alertController: AlertController) { }

  ngOnInit() {
  }

  home() {
    this.ui.home();
  }

  restrooms() {
    this.router.navigate(['tabs/profile/restrooms']);
  }

  async unimplemented() {
    const alert = await this.alertController.create({
      header: 'Under Development',      
      message: 'This feature is currently being worked on.',
      buttons: ['OK'],
    });

    await alert.present();
  }

  async share() {
    await Share.share({
      title: 'Dust in Curious Places',
      text: 'Check out the dust app for Burning Man events, art and theme camps.',
      url: 'https://dust.events/',
      dialogTitle: 'Share dust with friends',
    });
  }

}
