import { EventEmitter, Injectable, signal } from '@angular/core';

export type ArtPositionChange = 'start' | 'end' | 'middle' | 'unknown';
export interface ArtChanged {
  artId: string;
}
@Injectable({
  providedIn: 'root',
})
export class ArtService {
  public next = new EventEmitter<string>();
  public prev = new EventEmitter<string>();
  public position = signal<ArtPositionChange>('unknown');
  public artChanged = new EventEmitter<ArtChanged>();

  // Emits when the art page is left so that the art is scrolled into view
  public leftArtPage = new EventEmitter<void>();

  public currentArtId: string | undefined;
}
