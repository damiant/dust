import { Component, computed, input } from '@angular/core';
import { UiService } from '../ui/ui.service';
import { IonItem, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { compass, compassOutline, linkOutline, callOutline, mailOutline, ticketOutline, tvOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-link',
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.scss'],
  standalone: true,
  imports: [IonIcon, IonItem, CommonModule]
})
export class LinkComponent {

  text = input('');
  url = input('');
  icon = computed(() => {
    let url: string = this.url();
    let txt: string = this.text();
    console.log(url);
    if (url.includes('tel:') || url.includes('sms:')) {
      return 'call-outline';
    } else if (url.includes('mailto:')) {
      return 'mail-outline';
    } else if (url.includes('maps.')) {
      return 'compass-outline';
    } else if (url.includes('youtu.')) {
      return 'tv-outline';
    }
    if (txt.includes('ticket')) {
      return 'ticket-outline';
    }
    return 'link-outline'
  });

  simple = computed(() => {
    let txt: string = this.text();

    return !txt.includes('<');
  });

  html = computed(() => {
    let txt: string = this.text();
    return this.removeTagsExceptAllowed(txt, ['b', 'h1', 'h2', 'h3', 'h4', 'code', 'img', 'small', 'br', 'center', 'p', 'i', 'u', 'ul', 'li', 'ol']);
  });

  constructor(private ui: UiService) {
    addIcons({ linkOutline, compass, compassOutline, callOutline, mailOutline, ticketOutline, tvOutline })
  }

  link(url: string) {
    console.log('click', url);
    this.ui.openUrl(url);
  }

  private removeTagsExceptAllowed(string: string, allowedTags: string[]) {
    // Escape tag names and create allowed tags regex
    const escapedAllowedTags = allowedTags.map(escapeTag).join('|');

    // Match both opening and closing tags, including their attributes
    const disallowedTagsRegex = new RegExp(`<\/?([^>]+)(?:>)(?!<\/\\1>)`, 'gi');

    // Escape special characters in the matched tag
    function escapeTag(tag: string) {
      return tag.replace(/([\\\/<>+\-*!(){}.^$|\[\]])/g, '\\$&');
    }

    // Replace disallowed tags with an empty string
    return string.replace(disallowedTagsRegex, (match, tag) => {
      return escapedAllowedTags.includes(tag) ? match : '';
    });
  }
  private replaceAll(str: string, str1: string, str2: string, ignore = true) {
    return str.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignore ? "gi" : "g")), (typeof (str2) == "string") ? str2.replace(/\$/g, "$$$$") : str2);
  };
}
