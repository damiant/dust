import { Position } from '@capacitor/geolocation';
import { Art } from 'src/app/data/models';

export function asInt(s: any): number | undefined {
    if (s == 'new' || !s) {
        return undefined;
    }
    return parseInt(s, 10);
}

export async function broadcastPost(festivalId: string, art: Art, postion: Position): Promise<void> {
    await post('live', { festivalId, lng: postion.coords.longitude, lat: postion.coords.latitude, id: art.uid });
}

async function post(endpoint: string, data: any): Promise<void> {
    const url = `https://api.dust.events/${endpoint}`;
    const response = await webFetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        console.log(`Failed to post to ${url}: ${response.status} ${response.statusText}`);
    }
}

export function liveBurnId(festivalId: string): string {
    if (festivalId === 'ttitd-2025') {
        return '113'; // Dataset id for BRC Mutant Vehicles
    }
    return festivalId;
}

async function webFetchWithTimeout(url: string, options = {}, timeout: number = 5000) {
    if (!AbortSignal.timeout) {
        return await fetch(url, {
            cache: 'no-cache',
            ...options,
        });
    }
    const signal = AbortSignal.timeout(timeout);
    const response = await fetch(url, {
        cache: 'no-cache',
        ...options,
        signal,
    });
    return response;
}