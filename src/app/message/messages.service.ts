import { inject, Injectable, signal } from '@angular/core';
import { Item, RSSFeed } from './rss-feed';
import { DbService } from '../data/db.service';
import { Names } from '../data/models';
import { Email } from './emails';
import { hashCode, r2data_dust_events, replaceAll } from '../utils/utils';
import { SettingsService } from '../data/settings.service';

export interface Feed {
  messages: Message[];
}

export interface Message {
  title: string;
  description: string;
  published: string;
}

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  public email = signal<Email[]>([]);
  public feed = signal<RSSFeed>({} as any);
  private db = inject(DbService);
  private settings = inject(SettingsService);

  private async updateData(
    datasetId: string,
    rssFeed: string | undefined,
    mastodonHandle: string | undefined,
    _inboxEmail: boolean,
  ): Promise<void> {
    const url = mastodonHandle ? this.mastodonURL(mastodonHandle) : this.rssFeedUrl(rssFeed);
    if (url) {
      try {
        const res = await fetch(url, { method: 'GET' });
        const data: RSSFeed = await res.json();
        await this.db.writeData(datasetId, Names.messages, data);
        await this.cleanup(data);
        this.feed.set(this.toFeed(data));
      } catch (err) {
        console.error(`Failed to load messages feed ${url}`, err);
      }
    }
    // We now always fetch from messages because notifications appear here too


    let emailList: Email[] = [];
    try {
      const res = await fetch(`${r2data_dust_events}${datasetId}/messages.json?${Math.random()}`, { method: 'GET' });
      emailList = await res.json();
      // eslint-disable-next-line no-empty
    } catch {
      return;
      // Ignore JSON parse errors
    }
    const safeEmails = this.toEmails(emailList);
    await this.cleanupEmail(safeEmails);
    await this.db.writeData(datasetId, Names.emails, safeEmails);
    this.email.set(safeEmails);
  }

  public async getMessages(
    datasetId: string,
    rssFeed: string | undefined,
    mastodonHandle: string | undefined,
    inboxEmail: boolean,
  ): Promise<void> {
    const data = await this.db.readData(datasetId, Names.messages);
    console.log('Loaded messages from DB', data);
    await this.cleanup(data);
    this.feed.set(this.toFeed(data));
    const emails = await this.db.readData(datasetId, Names.emails);
    const safeEmails = this.toEmails(emails);
    await this.cleanupEmail(safeEmails);
    this.email.set(safeEmails);
    if (mastodonHandle || inboxEmail || rssFeed) {
      this.updateData(datasetId, rssFeed, mastodonHandle, inboxEmail);
    }
  }

  /**
   * Normalise a raw value into a proper RSSFeed object. Guards against null/array
   * defaults (e.g. when nothing is cached yet) and missing rss/channel structure.
   */
  private toFeed(data: any): RSSFeed {
    if (!data || typeof data !== 'object' || !data.rss || !data.rss.channel) {
      return {} as any;
    }
    const item = data.rss.channel.item;
    if (!Array.isArray(item)) {
      data.rss.channel.item = [];
    } else {
      data.rss.channel.item = item.filter((i: any) => !!i && typeof i === 'object');
    }
    return data as RSSFeed;
  }

  /** Normalise raw email data into a non-null array. */
  private toEmails(data: any): Email[] {
    if (!Array.isArray(data)) return [];
    return data.filter((email) => !!email && typeof email === 'object');
  }

  private readMessagesKey = 'messagesRead';

  public async markEmailAsRead(email: Email) {
    await this.markAsRead(this.hashOfEmail(email));
  }

  public async markMessageAsRead(message: Item) {
    await this.markAsRead(this.hashOfItem(message));
  }

  private async markAsRead(hash: number) {
    const list = await this.getReadMessageHashes();
    list.push(hash);
    await this.settings.set(this.readMessagesKey, JSON.stringify(list));
  }

  private async getReadMessageHashes(): Promise<number[]> {
    const read = await this.settings.get(this.readMessagesKey);
    let list = [];
    if (read) {
      list = JSON.parse(read);
    }
    return list;
  }

  private async cleanup(data: RSSFeed) {
    if (!data || !data.rss || !data.rss.channel) return;
    const list = await this.getReadMessageHashes();
    const items = data.rss.channel.item;
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (!item) continue;
      item.avatar = data.rss.channel.image?.url;

      const dt = new Date(item.pubDate);
      item.pubDate = dt.toLocaleDateString('en-us', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      item.read = list.includes(this.hashOfItem(item));

      if (item.title) {
        item.title = this.decodeHTMLEntities(item.title);
      }
      if (item.description) {
        item.description = item.description
          .replace(/\u00AD/g, '')
          .replace(/\u200C/g, '')
          .replace(/\u00A0/g, '')
          .replace(/\s+/g, ' ')
          .replace(/ ͏/g, '')
          .replace(/\s{2,}/g, ' ');
      }
    }
  }

  private hashOfItem(item: Item): number {
    return hashCode(item.link);
  }

  private hashOfEmail(email: Email): number {
    return hashCode(`${email.date}+${email.subject}`);
  }

  private async cleanupEmail(data: Email[]) {
    if (!Array.isArray(data)) return;
    const list = await this.getReadMessageHashes();
    for (const email of data) {
      if (!email) continue;
      if (email.html) {
        email.html = replaceAll(email.html, 'width="600"', '');
        email.html = replaceAll(email.html, 'Unsubscribe</a>', '</a>');
        email.html = replaceAll(email.html, 'Subscribe</a>', '</a>');
        email.html = replaceAll(email.html, 'Click here</a>', '</a>');
        email.html = replaceAll(email.html, 'inbox@dust.events', 'you');
        email.html = replaceAll(email.html, 'Unsubscribe instantly</a>', '</a>');
        email.html = replaceAll(email.html, 'list-manage.com/unsubscribe?', '');
        email.html = replaceAll(email.html, 'list-manage.com/profile?', '');
        email.html = replaceAll(email.html, 'unsubscribe', '');
        email.html = replaceAll(
          email.html,
          '<img src="https://cdn-images.mailchimp.com/monkey_rewards/intuit-mc-rewards-2.png"',
          '<div ',
        );
      }
      email.read = list.includes(this.hashOfEmail(email));
    }
  }

  private mastodonURL(mastodonHandle: string): string | undefined {
    // Format is @username@username
    const tmp = mastodonHandle.split('@');
    if (tmp.length < 3) {
      console.error(`Invalid mastodon handle ${mastodonHandle}`);
      return '';
    }
    const username = tmp[1];
    const server = tmp[2];
    return `https://api.dust.events/rss?feed=${server}/@${username}`;
  }

  private rssFeedUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    return `https://api.dust.events/rss?feed=${encodeURIComponent(url)}`;
  }

  private decodeHTMLEntities(text: string) {
    const entities: any = {
      '&#8221;': '”',
      '&#8216;': '‘',
      '&#8217;': '’',
      '&#8220;': '“',
      '&#8230;': '…',
      // Add more entities as needed
    };

    return text.replace(/&#[0-9]+;/g, (match) => {
      return entities[match] || match;
    });
  }
}
