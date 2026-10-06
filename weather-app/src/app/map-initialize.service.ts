import { Injectable } from '@angular/core';
import type { Map, Marker } from 'maplibre-gl';

@Injectable({
  providedIn: 'root',
})
export class MapInitializeService {

  private map?: Map;
  private marker?: Marker;
  private ready?: Promise<void>;

  // Creates the map on first use, then flies to each new location.
  // maplibre-gl is ~800 kB, so it is loaded lazily to keep the initial bundle small.
  async show(container: HTMLElement, lat: number, lng: number): Promise<void> {
    const center: [number, number] = [lng, lat];

    if (!this.ready) {
      this.ready = this.create(container, center);
      return this.ready;
    }

    await this.ready;
    this.marker?.setLngLat(center);
    this.map?.flyTo({ center, zoom: 9, essential: true });
  }

  destroy(): void {
    this.map?.remove();
    this.map = undefined;
    this.marker = undefined;
    this.ready = undefined;
  }

  private async create(container: HTMLElement, center: [number, number]): Promise<void> {
    const maplibregl = await import('maplibre-gl');
    this.map = new maplibregl.Map({
      container,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', // A free map style
      center,
      zoom: 9,
    });
    this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    this.marker = new maplibregl.Marker({ color: '#ffb547' }).setLngLat(center).addTo(this.map);
  }
}
