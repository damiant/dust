import { Network } from '@capacitor/network';
import { Dataset } from './models';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { CapacitorHttp, HttpOptions, HttpResponse, HttpResponseType } from '@capacitor/core';
import { data_dust_events, static_dust_events } from '../utils/utils';
//https://dust.events/assets/data/datasets.json

export function datasetFilename(dataset: Dataset): string {
  if (dataset.name == 'TTITD') {
    return `${dataset.name.toLowerCase()}-${dataset.year.toLowerCase()}`;
  } else {
    return `${dataset.name.toLowerCase()}`;
  }
}

function path(dataset: string, name: string): string {
  return `assets/${dataset}/${name}.json`;
}

function livePath(dataset: string, name: string, ext?: string): string {
  if (name == 'festivals') {
    return `${data_dust_events}${dataset}.${ext ? ext : 'json'}`;
  }
  if (dataset.toLowerCase().includes('ttitd') || dataset == 'datasets') {
    return `${static_dust_events}${dataset}/${name}.${ext ? ext : 'json'}`;    
  } else {
    return `${data_dust_events}${dataset}/${name}.${ext ? ext : 'json'}`;
  }
}

export async function getCached(dataset: string, name: string, timeout: number = 5000): Promise<any> {
  try {
    console.log(`getCached ${livePath(dataset, name)} ${dataset} ${name}...`);
    const res = await fetchWithTimeout(livePath(dataset, name), timeout);
    const data = res.data;
    // Store cached data
    await save(getId(dataset, name), data);
    return data;
  } catch (error) {
    console.info(`getCached.error(${dataset} ${name})`, error);

    // Get from the storage
    const data = await read(getId(dataset, name));
    if (data) {
      console.info(`handled getCached.error with read from storage (${dataset} ${name})`, error);
      return data;
    }

    // else Get default value
    console.error(`handled getCached.error with get default value (${dataset} ${name})`, error);
    return await get(dataset, name);
  }
}

function getId(dataset: string, name: string): string {
  return `${dataset}-${name}`;
}

async function read(id: string): Promise<any> {
  try {
    console.log(`Reading from filesystem ${id}`);
    const contents = await Filesystem.readFile({
      path: `${id}.json`,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return JSON.parse(contents.data as any);
  } catch {
    return undefined;
  }
}

async function save(id: string, data: any) {
  await Filesystem.writeFile({
    path: `${id}.json`,
    data: JSON.stringify(data),
    directory: Directory.Data,
    encoding: Encoding.UTF8,
  });
}

export async function getLive(dataset: string, name: string, timeout: number = 5000): Promise<any> {
  const status = await Network.getStatus();
  if (!status.connected) {
    console.log(`readData ${dataset} ${name}...`);
    return await get(dataset, name);
  } else {
    // Try to get from url
    const url = livePath(dataset, name);
    console.log(`getLive ${url} ${dataset} ${name}...`);
    try {
      const res = await fetchWithTimeout(url, timeout);
      return res.data;
    } catch (error) {
      console.error(`Unable to download live from ${url}`, error);
      return [];
    }
  }
}

export async function getLiveBinary(dataset: string, name: string, ext: string, revision: string): Promise<any> {
  const status = await Network.getStatus();
  if (!status.connected) {
    return undefined;
  } else {
    // Try to get from url
    try {
      const url = livePath(dataset, name, ext) + `?${revision}`;
      console.log(`getLive ${url} ${dataset} ${name}...`);
      const res = await fetchWithTimeout(url, 15000, 'blob');
      return res.data;
    } catch (error) {
      console.error(`Failed getLiveBinary`);
      throw new Error(error as string);
    }
  }
}

// Hack for Capacitor: See https://github.com/ionic-team/capacitor/issues/1564
function getFileReader(): FileReader {
  const fileReader = new FileReader();
  const zoneOriginalInstance = (fileReader as any)['__zone_symbol__originalInstance'];
  return zoneOriginalInstance || fileReader;
}

function blobToBase64(blob: Blob) {
  return new Promise((resolve, reject) => {
    try {
      const reader = getFileReader(); // new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    } catch (e) {
      reject(e);
    }
  });
}

async function fetchWithTimeout(
  url: string,
  timeout: number = 5000,
  responseType: HttpResponseType = 'json',
): Promise<HttpResponse> {
  if (responseType == 'blob') {
    // Cap HTTP doesnt do blobs
    const res = await webFetchWithTimeout(url, {}, timeout);
    const blob = await res.blob();
    const data = await blobToBase64(blob);
    return { data, status: res.status, url, headers: {} };
  }

  const options: HttpOptions = {
    url,
    responseType: responseType,
    connectTimeout: timeout,
    readTimeout: timeout
  };
  // const id = setTimeout(() => {
  //   throw new Error(`Timeout on ${url}`);
  // }, timeout);

  console.log(`caphttp fetch ${url}`);
  const response: HttpResponse = await CapacitorHttp.get(options);
  // clearTimeout(id);
  return response;
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

async function get(dataset: string, name: string): Promise<any> {
  const res = await fetch(path(dataset, name));
  return await res.json();
}
