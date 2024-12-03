import { Component, computed, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { UiService } from '../ui/ui.service';
import { IonItem, IonIcon, IonCardContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  compass,
  compassOutline,
  linkOutline,
  callOutline,
  mailOutline,
  ticketOutline,
  tvOutline,
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { CachedImgComponent } from '../cached-img/cached-img.component';
@Component({
    selector: 'app-link',
    templateUrl: './link.component.html',
    styleUrls: ['./link.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonCardContent, IonIcon, IonItem, CommonModule, CachedImgComponent]
})
export class LinkComponent {
  private ui = inject(UiService);
  text = input('');
  url = input('');
  icon = computed(() => {
    let url: string = this.url();
    let txt: string = this.text();
    if (url.includes('tel:') || url.includes('sms:')) {
      return 'call-outline';
    } else if (url.includes('mailto:')) {
      return 'mail-outline';
    } else if (url.includes('maps.')) {
      return 'compass-outline';
    } else if (url.includes('youtu.') || url.includes('youtube.')) {
      return 'tv-outline';
    }
    if (txt.includes('ticket')) {
      return 'ticket-outline';
    }
    return 'link-outline';
  });

  type = computed(() => {
    let txt: string = this.text();
    let url: string = this.url();
    if ( url && (
      url.endsWith('.jpeg') ||
      url.endsWith('.jpg') ||
      url.endsWith('.webp') ||
      url.endsWith('.gif') ||
      url.endsWith('.png')
    )) {
      return 'image';
    }
    if (txt.includes('<')) {
      return 'complex';
    }
    return 'simple';
  });

  html = computed(() => {
    let txt: string = this.text();

    return this.removeTagsExceptAllowed(txt, [
      'b',
      'h1',
      'h2',
      'h3',
      'h4',
      'code',
      'img',
      'small',
      'br',
      'center',
      'p',
      'i',
      'u',
      'ul',
      'li',
      'ol',
    ]);
  });

  constructor() {
    addIcons({ linkOutline, compass, compassOutline, callOutline, mailOutline, ticketOutline, tvOutline });
  }

  link(url: string) {
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
}
