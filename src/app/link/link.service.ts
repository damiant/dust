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

        (await this.getRegistrationLinks()).map(
            l => groups[0].links.unshift(l));

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
        let title = `<h2>${startDay} ${dates} ${start.getFullYear()}</h2>`;
        if (ds.unknownDates) {
            title = `<h2>Dates to be decided<h2>`;
        }
        title += `<p>${ds.region}</p>`;
        const url = ds.website;
        return { uid: '0', title, url };
    }

    private async getRegistrationLinks(): Promise<Link[]> {
        const ds = this.db.selectedDataset();
        const links: Link[] = [];
        // if (ds.event_registration) {
        //     links.push({ uid: '-2', title: 'Register Event () In Open Camping', url: `https://edit.dust.events/${ds.id}/events` });
        // }
        if (ds.camp_registration || ds.event_registration) {
            links.push({ uid: '-1', title: this.entity(ds), 
                url: `./admin.html`
             }); 
        }
        return links;
    }

    private entity(ds: Dataset): string {
        const token = decodeToken();
        console.log(ds, token);
        if (!token) return `Sign In`;
        if (token.festivals.length > 0) {
            return `Manage the burn`;
        }
        if (token.camps.length == 1) {
            return `Manage my camp`;
        }
        if (token.art.length == 1) {
            return `Manage my art`;
        }
        if (token.events.length = 1) {
            return `Manage my event`;
        }
        if (token.events.length > 1) {
            return `Manage my events`;
        }
        return `Manage my burn`;
    }
}