import { Network } from '@capacitor/network';
import { Dataset } from './models';
//https://dust.events/assets/data/datasets.json

export function datasetFilename(dataset: Dataset): string {
    return `${dataset.name.toLowerCase()}-${dataset.year.toLowerCase()}`;
}

function path(dataset: string, name: string): string {
    return `assets/${dataset}/${name}.json`;
}

function livePath(dataset: string, name: string): string {
    return `https://dust.events/assets/data/${dataset}/${name}.json`;
}

export async function getLive(dataset: string, name: string): Promise<any> {
    const status = await Network.getStatus();
    if (!status.connected) {
        return await get(dataset, name);
    } else {
        // Try to get from url        
        const res = await fetch(livePath(dataset, name));
        return await res.json();
    }
}

async function get(dataset: string, name: string): Promise<any> {
    const res = await fetch(path(dataset, name));
    return await res.json();
}