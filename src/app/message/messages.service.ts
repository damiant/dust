import { inject, Injectable, signal } from '@angular/core';
import { MastodonFeed } from './mastodon-feed';
import { DbService } from '../data/db.service';
import { Names } from '../data/models';

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
    public feed = signal<MastodonFeed>({} as any);
    private db = inject(DbService);

    private async updateData(datasetId: string): Promise<void> {
        const url = `https://api.dust.events/rss?feed=mastodon.online/@damiant`;
        const res = await fetch(url, { method: 'GET' });        
        const data: MastodonFeed = await res.json();
        await this.db.writeData(datasetId, Names.messages, data);
        this.cleanup(data);
        this.feed.set(data);
    }

    public async getMessages(datasetId: string): Promise<void> {
        const data = await this.db.readData(datasetId, Names.messages);
        this.cleanup(data);
        this.feed.set(data);
        this.updateData(datasetId);
        
    }

    private cleanup(data: MastodonFeed) {
        if (!data.rss || !data.rss.channel) return;
        for (let item of data.rss.channel.item) {
            item.avatar = data.rss.channel.image.url;
            const dt = new Date(item.pubDate);
            item.pubDate = dt.toLocaleDateString('en-us', { weekday:'long', year:'numeric', month:'short', day:'numeric'});
        }
    }
}