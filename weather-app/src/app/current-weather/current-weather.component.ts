import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import { WeatherService } from '../weather.service';
import { MapInitializeService } from '../map-initialize.service';
import { CurrentWeather, Forecast, WeatherLocation } from '../weather.models';

type Units = 'metric' | 'imperial';

const DEFAULT_CITY = 'London';
const CITY_KEY = 'weather.city';
const UNITS_KEY = 'weather.units';
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

@Component({
  selector: 'app-current-weather',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './current-weather.component.html',
  styleUrl: './current-weather.component.css'
})
export class CurrentWeatherComponent implements OnInit, OnDestroy {
  @ViewChild('map', { static: true }) mapElement!: ElementRef<HTMLElement>;

  query = '';
  current = signal<CurrentWeather | null>(null);
  forecast = signal<Forecast | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  units = signal<Units>(readStorage(UNITS_KEY) === 'imperial' ? 'imperial' : 'metric');

  // City-local UTC offset (e.g. "+0530") so times show in the searched city's timezone.
  timezone = computed(() => {
    const seconds = this.current()?.timezone ?? 0;
    const minutes = Math.abs(seconds) / 60;
    const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
    return `${seconds < 0 ? '-' : '+'}${pad(minutes / 60)}${pad(minutes % 60)}`;
  });

  theme = computed(() => themeFor(this.current()));

  weekRange = computed(() => {
    const days = this.forecast()?.daily ?? [];
    return {
      min: Math.min(...days.map(day => day.min)),
      max: Math.max(...days.map(day => day.max)),
    };
  });

  private request?: Subscription;

  constructor(
    private weatherService: WeatherService,
    private http: HttpClient,
    private mapInitializeService: MapInitializeService,
  ) { }

  ngOnInit(): void {
    const savedCity = readStorage(CITY_KEY);
    if (savedCity) {
      this.load({ city: savedCity });
      return;
    }
    this.loading.set(true);
    this.http.get<{ city?: string }>('https://ipapi.co/json/').subscribe({
      next: response => this.load({ city: response.city || DEFAULT_CITY }),
      error: () => this.load({ city: DEFAULT_CITY }),
    });
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
    this.mapInitializeService.destroy();
  }

  search(): void {
    const city = this.query.trim();
    if (city) {
      this.load({ city });
    }
  }

  useMyLocation(): void {
    if (!navigator.geolocation) {
      this.error.set('Your browser does not support location access.');
      return;
    }
    this.loading.set(true);
    navigator.geolocation.getCurrentPosition(
      position => this.load({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => {
        this.loading.set(false);
        this.error.set('Location access was denied. Search for a city instead.');
      },
    );
  }

  setUnits(units: Units): void {
    this.units.set(units);
    writeStorage(UNITS_KEY, units);
  }

  temp(celsius: number): number {
    return Math.round(this.units() === 'imperial' ? celsius * 9 / 5 + 32 : celsius);
  }

  wind(metresPerSecond: number): string {
    return this.units() === 'imperial'
      ? `${Math.round(metresPerSecond * 2.237)} mph`
      : `${Math.round(metresPerSecond * 3.6)} km/h`;
  }

  visibility(metres: number): string {
    return this.units() === 'imperial'
      ? `${(metres / 1609).toFixed(1)} mi`
      : `${(metres / 1000).toFixed(1)} km`;
  }

  compass(degrees: number): string {
    return COMPASS[Math.round(degrees / 45) % 8];
  }

  iconUrl(icon: string, size: 2 | 4 = 2): string {
    return this.weatherService.iconUrl(icon, size);
  }

  rangeStyle(min: number, max: number): { left: string; width: string } {
    const { min: lowest, max: highest } = this.weekRange();
    const span = highest - lowest || 1;
    return {
      left: `${((min - lowest) / span) * 100}%`,
      width: `${Math.max(((max - min) / span) * 100, 4)}%`,
    };
  }

  private load(location: WeatherLocation): void {
    this.loading.set(true);
    this.error.set(null);
    this.request?.unsubscribe();

    this.request = forkJoin([
      this.weatherService.getCurrentWeather(location),
      this.weatherService.getForecast(location),
    ]).subscribe({
      next: ([current, forecast]) => {
        this.current.set(current);
        this.forecast.set(forecast);
        this.loading.set(false);
        this.query = '';
        writeStorage(CITY_KEY, current.name);
        void this.mapInitializeService.show(this.mapElement.nativeElement, current.coord.lat, current.coord.lon);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.status === 404 && 'city' in location
          ? `We couldn't find "${location.city}". Check the spelling and try again.`
          : 'Unable to load the weather right now. Please try again.');
      },
    });
  }
}

function themeFor(weather: CurrentWeather | null): string {
  if (!weather) {
    return 'day';
  }
  const night = weather.weather[0].icon.endsWith('n');
  switch (weather.weather[0].main) {
    case 'Clear':
      return night ? 'night' : 'day';
    case 'Clouds':
      return night ? 'night' : 'clouds';
    case 'Rain':
    case 'Drizzle':
      return 'rain';
    case 'Thunderstorm':
      return 'storm';
    case 'Snow':
      return 'snow';
    default:
      return 'mist';
  }
}

// Storage can be unavailable (private mode, blocked cookies); treat it as optional.
function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore: remembering the last city is a convenience only.
  }
}
