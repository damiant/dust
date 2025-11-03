import { Art } from 'src/app/data/models';

export function asInt(s: any): number | undefined {
  if (s == 'new' || !s) {
    return undefined;
  }
  return parseInt(s, 10);
}

export async function broadcastPost(
  festivalId: string,
  art: Art,
  lng: number,
  lat: number,
  pin: string,
): Promise<void> {
  await post('live', { festivalId, lng, lat, id: art.uid, pin });
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

export function encryptedMV(artId: string): string {
  const key = artId.replace('u-', '');
  return hashToFourDigitCode(key);
}

function hashToFourDigitCode(str: string) {
  // Basic hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // keep it a 32-bit integer
  }

  // Make it a positive number and map to 0–9999
  const num = Math.abs(hash) % 10000;

  // Zero-pad to 4 digits
  return num.toString().padStart(4, '0');
}

export function liveBurnDataset(festivalId: string): string {
  if (festivalId === 'ttitd-2025') {
    return 'brc-mutant-vehicles'; // Dataset id for BRC Mutant Vehicles
  }
  return `${festivalId}`;
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
