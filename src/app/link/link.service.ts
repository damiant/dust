import { inject, Injectable } from '@angular/core';
import { Group, Link } from '../data/models';
import { NotificationService } from '../notifications/notification.service';
import { DbService } from '../data/db.service';
import { UiService } from '../ui/ui.service';
import { SettingsService } from '../data/settings.service';
import { nowAtEvent } from '../utils/utils';

@Injectable({
  providedIn: 'root',
})
export class LinkService {
  db = inject(DbService);
  settings = inject(SettingsService);
  ui = inject(UiService);
  private notifications = inject(NotificationService);
  private displayNotificationInProgress = new Set<string>();

  public async getGroupedLinks(): Promise<Group[]> {
    const links = await this.db.getLinks();
    const filteredLinks = this.filterLinksByDate(links);
    return await this.group(filteredLinks);
  }

  /** Schedule future link announcements once per link for this app session. */
  public async scheduleDisplayFromNotifications(): Promise<void> {
    const links = await this.db.getLinks();
    const datasetId = this.db.selectedDataset().id;

    for (const link of links) {
      if (!link.displayFrom || !link.uid) continue;
      const key = `display-from-notification:${datasetId}:${link.uid}`;
      if (sessionStorage.getItem(key) || this.displayNotificationInProgress.has(key)) continue;

      const displayFrom = new Date(link.displayFrom);
      if (Number.isNaN(displayFrom.getTime()) || displayFrom.getTime() <= Date.now()) continue;

      this.displayNotificationInProgress.add(key);
      try {
        const scheduled = await this.notifications.scheduleLink(link, this.db.selectedDataset().title);
        if (scheduled) sessionStorage.setItem(key, '1');
      } catch (error) {
        console.error('Unable to schedule link notification', error);
      } finally {
        this.displayNotificationInProgress.delete(key);
      }
    }
  }

  private filterLinksByDate(links: Link[]): Link[] {
    const now = nowAtEvent(this.db.getTimeZone());
    return links.filter((link) => {
      if (link.displayFrom) {
        const displayFrom = new Date(link.displayFrom);
        if (now < displayFrom) {
          return false;
        }
      }
      if (link.displayTo) {
        const displayTo = new Date(link.displayTo);
        if (now > displayTo) {
          return false;
        }
      }
      return true;
    });
  }

  private async group(links: Link[]): Promise<Group[]> {
    const groups: Group[] = [];
    let group: Group = { id: 1, links: [] };
    for (const link of links) {
      if (link.title.startsWith('#')) {
        link.title = link.title.substring(1);
        if (group.links.length > 0) {
          // Start a new group
          groups.push(group);
          group = { id: group.id + 1, links: [] };
        }
        group.links.push(link);
      } else {
        group.links.push(link);
      }
    }
    if (group.links.length > 0) {
      groups.push(group);
    }
    // Insert into the first group details of the event
    if (groups.length === 0) {
      groups.push(group);
    }

    groups[0].links.unshift(this.getEventInfo());

    return groups;
  }

  private getEventInfo(): Link {
    const ds = this.db.selectedDataset();
    const start = new Date(ds.start);
    const end = new Date(ds.end);
    const startDay = start.toLocaleDateString('default', { weekday: 'long' });
    const monthName = start.toLocaleString('default', { month: 'long' });
    const endMonthName = end.toLocaleString('default', { month: 'long' });
    let dates = `${monthName} ${start.getDate()}-${end.getDate()}`;
    if (monthName !== endMonthName) {
      dates = `${monthName} ${start.getDate()} - ${endMonthName} ${end.getDate()}`;
    }
    //let title = `<h2>${startDay}</h2><p>${dates} ${start.getFullYear()}</p>`;
    let title = `<h2>${ds.region}</h2>`;
    if (ds.unknownDates) {
      title += `<h2>Dates to be decided<h2>`;
    } else {
      title += `<p>${startDay} ${dates}, ${start.getFullYear()}</p>`;
    }
    const url = ds.website;
    return { uid: '0', title, url };
  }
}
