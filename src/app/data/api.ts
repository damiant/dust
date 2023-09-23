import { Network } from '@capacitor/network';
import { Dataset } from './models';
//https://dust.events/assets/data/datasets.json

export function datasetFilename(dataset: Dataset): string {
    return `${dataset.name.toLowerCase()}-${dataset.year.toLowerCase()}`;
}

function path(dataset: string, name: string): string {
    return `assets/${dataset}/${name}.json`;
}

function livePath(dataset: string, name: string, ext?: string): string {
    if (dataset.toLowerCase().includes('ttitd') || dataset == 'datasets') {
        return `https://dust.events/assets/data-v2/${dataset}/${name}.${ext ? ext : 'json'}`;
    } else {
        return `https://data.dust.events/${dataset}/${name}.${ext ? ext : 'json'}`;
    }
}

export async function getLive(dataset: string, name: string, timeout: number = 5000): Promise<any> {
    const status = await Network.getStatus();
    if (!status.connected) {
        console.log(`readData ${dataset} ${name}...`);

        return await get(dataset, name);

    } else {
        // Try to get from url        
        console.log(`getLive ${livePath(dataset, name)} ${dataset} ${name}...`);
        try {
            const res = await fetchWithTimeout(livePath(dataset, name), {}, timeout);
            return await res.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    }
}

export async function getLiveBinary(dataset: string, name: string, ext: string): Promise<any> {
    const status = await Network.getStatus();
    if (!status.connected) {
        return undefined;
    } else {
        // Try to get from url
        try {
            const url = livePath(dataset, name, ext);
            console.log(`getLive ${url} ${dataset} ${name}...`);
            const res = await fetchWithTimeout(url, {}, 15000);
            console.log(`getLive ${url} convert to blob`);
            const blob = await res.blob();
            console.log(`getLive ${url} converted to blob. Size is ${blob.size}`);
            console.log(`getLive ${url} convert to base64`);
            const data = await blobToBase64(blob);
            console.log(`getLive ${url} complete`);
            return data;
        } catch (error) {
            console.error(`Failed getLiveBinary`);
            throw new Error(error as string);
        }
    }
}


// Hack for Capacitor: See https://github.com/ionic-team/capacitor/issues/1564
function getFileReader(): FileReader {
    const fileReader = new FileReader();
    const zoneOriginalInstance = (fileReader as any)["__zone_symbol__originalInstance"];
    return zoneOriginalInstance || fileReader;
}

function blobToBase64(blob: Blob) {
    return new Promise((resolve, reject) => {
        try {
            const reader = getFileReader();// new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        } catch (e) {
            reject(e);
        }
    });
}

async function fetchWithTimeout(url: string, options = {}, timeout: number = 5000) {
    if (!AbortSignal.timeout) {
        return await fetch(url, {
            ...options
        });
    }
    const signal = AbortSignal.timeout(timeout);
    const response = await fetch(url, {
        ...options,
        signal
    });
    return response;
}

async function get(dataset: string, name: string): Promise<any> {
    const res = await fetch(path(dataset, name));
    return await res.json();
}