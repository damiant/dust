import { Component, inject, OnInit, signal } from '@angular/core';
import { IonCard, IonCardContent, IonText } from "@ionic/angular/standalone";
import { CardHeaderComponent } from '../card-header/card-header.component';
import { DbService } from '../data/db.service';
import { Dataset } from '../data/models';
import { decodeToken, Token } from '../data/auth';

@Component({
  selector: 'app-participate',
  templateUrl: './participate.component.html',
  styleUrls: ['./participate.component.scss'],
  imports: [IonCard, IonCardContent, CardHeaderComponent, IonText]
})
export class ParticipateComponent implements OnInit {
  db = inject(DbService);
  participate = signal(false);
  cta = signal('Sign In');
  private token: Token | undefined;
  message = signal('if you want to register or edit a theme camp, event, mutant vehicle or art.');
  constructor() {

  }

  ngOnInit() {
    const ds = this.db.selectedDataset();
    console.log(ds);
    this.token = decodeToken();
    const ownerOf = this.entity(this.token, ds);
    if (ds.camp_registration || ds.event_registration) {
      if (!this.db.isHistorical()) {
        // Only edit if event is in the past
        this.participate.set(true);
      }
    }
    if (this.token && this.token.festivals.length > 0) {
      // Allow edit if admin
      this.participate.set(true);
    }

    if (ownerOf) {
      this.cta.set(`Manage`);
      this.message.set(`${ownerOf}`);
    }
  }

  signIn() {
    sessionStorage.setItem('openburn', this.db.selectedDataset().id);
    document.location.href = `./admin.html`;
  }

  private entity(token: Token | undefined, ds: Dataset): string | undefined {
    if (!token) return undefined;
    if (token.festivals.length > 0) {
      if (token.festivals.includes(ds.uid)) {
        return `${ds.title}`;
      } else {
        return undefined;
      }
    }
    if (!token.viewFestivals.includes(ds.uid)) {
      return `${ds.title}`;
    }
    if (token.camps.length == 1) {
      return `your camp`;
    }
    if (token.art.length == 1) {
      return `your art or mutant vehicle`;
    }
    if (token.events.length = 1) {
      return `your event`;
    }
    if (token.events.length > 1) {
      return `your events`;
    }
    return `${ds.title}`;
  }

}
