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

    private async updateData(datasetId: string, rssFeed: string | undefined, mastodonHandle: string | undefined, inboxEmail: boolean): Promise<void> {
        const url = mastodonHandle ? this.mastodonURL(mastodonHandle) : rssFeed;
        if (url) {
            const res = await fetch(url, { method: 'GET' });
            const data: RSSFeed = await res.json();
            await this.db.writeData(datasetId, Names.messages, data);
            await this.cleanup(data);
            this.feed.set(data);
        }
        if (inboxEmail) {
            const res = await fetch(`${r2data_dust_events}${datasetId}/messages.json?${Math.random()}`, { method: 'GET' });
            const emailList: Email[] = await res.json();
            await this.cleanupEmail(emailList);
            await this.db.writeData(datasetId, Names.emails, emailList);
            this.email.set(emailList);
        }
    }

    public async getMessages(datasetId: string, rssFeed: string | undefined, mastodonHandle: string | undefined, inboxEmail: boolean): Promise<void> {
        const data = await this.db.readData(datasetId, Names.messages);
        await this.cleanup(data);
        this.feed.set(data);
        const emails = await this.db.readData(datasetId, Names.emails);
        await this.cleanupEmail(emails);
        this.email.set(emails);        
        if (mastodonHandle || inboxEmail || rssFeed) {
            this.updateData(datasetId, rssFeed,  mastodonHandle, inboxEmail);
        }
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
        let read = await this.settings.get(this.readMessagesKey);
        let list = [];
        if (read) {
            list = JSON.parse(read);
        }
        return list;
    }

    private async cleanup(data: RSSFeed) {
        if (!data.rss || !data.rss.channel) return;
        let list = await this.getReadMessageHashes();
        for (let item of data.rss.channel.item) {
            item.avatar = data.rss.channel.image.url;
            const dt = new Date(item.pubDate);
            item.pubDate = dt.toLocaleDateString('en-us', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
            item.read = list.includes(this.hashOfItem(item));
        }
    }

    private hashOfItem(item: Item): number {
        return hashCode(item.link);
    }

    private hashOfEmail(email: Email): number {
        return hashCode(`${email.date}+${email.subject}`);
    }

    private async cleanupEmail(data: Email[]) {
        let list = await this.getReadMessageHashes();
        for (let email of data) {
            email.html = replaceAll(email.html, 'width="600"', '');
            email.html = replaceAll(email.html, 'Unsubscribe</a>', '</a>');
            email.html = replaceAll(email.html, 'Subscribe</a>', '</a>');
            email.html = replaceAll(email.html, 'Click here</a>', '</a>');
            email.html = replaceAll(email.html, 'inbox@dust.events', 'you');
            email.html = replaceAll(email.html, 'Unsubscribe instantly</a>', '</a>');
            email.html = replaceAll(email.html, 'list-manage.com/unsubscribe?','');
            email.html = replaceAll(email.html, 'list-manage.com/profile?','');
            email.html = replaceAll(email.html, 'unsubscribe', '');
            email.html = replaceAll(email.html, '<img src="https://cdn-images.mailchimp.com/monkey_rewards/intuit-mc-rewards-2.png"','<div ');
            email.read = list.includes(this.hashOfEmail(email));
        }
    }


    private mastodonURL(mastodonHandle: string): string {
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
}