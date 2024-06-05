import { Injectable } from '@angular/core';
import * as maplibregl from 'maplibre-gl';

@Injectable({
  providedIn: 'root',
})
export class MapInitializeService {

  map: maplibregl.Map | any;
  marker: maplibregl.Marker | any;

  constructor() {}

  initializeMap(container: string, lat: number, lng: number): void {
    this.map = new maplibregl.Map({
      container: container,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', // A free map style
      center: [lng, lat],
      zoom: 12,
    });
    this.map.addControl(new maplibregl.NavigationControl());

    this.marker = new maplibregl.Marker()
      .setLngLat([lng, lat])
      .addTo(this.map);
  }

  updateMarker(lat: number, lng: number): void {
    this.marker.setLngLat([lng, lat]);
    this.map.flyTo({
      center: [lng, lat],
      essential: true,
    });
  }
}
