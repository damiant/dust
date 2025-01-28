import { inject, Injectable } from "@angular/core";
import { Dataset, Group, Link } from "../data/models";
import { DbService } from "../data/db.service";
import { UiService } from "../ui/ui.service";
import { SettingsService } from "../data/settings.service";
import { decodeToken } from "../data/auth";

@Injectable({
    providedIn: 'root',
})
export class LinkService {

    db = inject(DbService);
    settings = inject(SettingsService);
    ui = inject(UiService);

    public async getGroupedLinks(): Promise<Group[]> {
        const links = await this.db.getLinks();
        return await this.group(links);
    }

    private async group(links: Link[]): Promise<Group[]> {
        let groups: Group[] = [];
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