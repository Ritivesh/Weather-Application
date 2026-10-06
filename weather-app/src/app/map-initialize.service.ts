import { Injectable } from '@angular/core';
import type { Map, Marker, StyleSpecification } from 'maplibre-gl';

export type WeatherLayer = 'none' | 'precipitation_new' | 'clouds_new' | 'temp_new';

const API_KEY = '7434c68243142e3208ff238fde743f0d';

@Injectable({
  providedIn: 'root',
})
export class MapInitializeService {
  private map?: Map;
  private marker?: Marker;
  private ready?: Promise<void>;
  private activeLayer: WeatherLayer = 'none';

  async show(container: HTMLElement, lat: number, lng: number): Promise<void> {
    const center: [number, number] = [lng, lat];

    if (!this.ready) {
      this.ready = this.create(container, center);
    }
    await this.ready;

    if (this.map) {
      this.marker?.setLngLat(center);
      this.map.flyTo({ center, zoom: 7, essential: true });
      setTimeout(() => {
        this.map?.resize();
        this.applyWeatherLayer(this.activeLayer);
      }, 150);
    }
  }

  setLayer(layer: WeatherLayer): void {
    this.activeLayer = layer;
    if (this.map) {
      this.applyWeatherLayer(layer);
    }
  }

  destroy(): void {
    this.map?.remove();
    this.map = undefined;
    this.marker = undefined;
    this.ready = undefined;
  }

  private async create(container: HTMLElement, center: [number, number]): Promise<void> {
    const maplibreModule = await import('maplibre-gl');
    const maplibregl: typeof import('maplibre-gl') = (maplibreModule as any).default || maplibreModule;

    const styleSpec: StyleSpecification = {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        },
      },
      layers: [
        {
          id: 'carto-dark-layer',
          type: 'raster',
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    };

    this.map = new maplibregl.Map({
      container,
      style: styleSpec,
      center,
      zoom: 7,
    });

    this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    this.marker = new maplibregl.Marker({ color: '#ffb547' }).setLngLat(center).addTo(this.map);

    this.map.on('load', () => {
      this.applyWeatherLayer(this.activeLayer);
      this.map?.resize();
    });
  }

  private applyWeatherLayer(layer: WeatherLayer): void {
    if (!this.map || !this.map.isStyleLoaded()) return;

    const layerId = 'weather-layer';
    const sourceId = 'weather-source';

    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
    }

    if (layer === 'none') return;

    this.map.addSource(sourceId, {
      type: 'raster',
      tiles: [`https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${API_KEY}`],
      tileSize: 256,
    });

    this.map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: {
        'raster-opacity': 0.7,
      },
    });
  }
}
