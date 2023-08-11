import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class MessageComponent  implements OnInit {

  @Input() show = false;

  @Input() message = '';
  @Input() title = '';
  @Output() dismissed = new EventEmitter<void>();
  constructor() { }

  ngOnInit() {}

  close() {    
    this.show = false; 
  }

  dismiss() {
    this.close();       
    this.dismissed.emit();
  }



}
