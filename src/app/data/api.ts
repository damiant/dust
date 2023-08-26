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
    return `https://dust.events/assets/data-v2/${dataset}/${name}.json`;
}

export async function getLive(dataset: string, name: string, timeout :number = 5000): Promise<any> {    
    const status = await Network.getStatus();
    if (!status.connected) {
        console.log(`readData ${dataset} ${name}...`);
        return await get(dataset, name);
    } else {
        // Try to get from url        
        console.log(`getLive ${livePath(dataset, name)} ${dataset} ${name}...`);
        const res = await fetchWithTimeout(livePath(dataset, name), {}, timeout);
        return await res.json();
    }
}

async function fetchWithTimeout(url: string, options = {}, timeout :number = 5000) {   
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