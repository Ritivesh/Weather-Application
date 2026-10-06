import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CurrentWeather,
  DailyPoint,
  Forecast,
  ForecastItem,
  ForecastResponse,
  WeatherLocation,
} from './weather.models';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiKey = '7434c68243142e3208ff238fde743f0d';
  private apiUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(private http: HttpClient) { }

  getCurrentWeather(location: WeatherLocation): Observable<CurrentWeather> {
    return this.http.get<CurrentWeather>(`${this.apiUrl}/weather`, { params: this.params(location) });
  }

  // The free /forecast endpoint returns 40 three-hour slots (5 days); split them
  // into the next 24 hours and one summary per local calendar day.
  getForecast(location: WeatherLocation): Observable<Forecast> {
    return this.http
      .get<ForecastResponse>(`${this.apiUrl}/forecast`, { params: this.params(location) })
      .pipe(map(response => this.toForecast(response)));
  }

  iconUrl(icon: string, size: 2 | 4 = 2): string {
    return `https://openweathermap.org/img/wn/${icon}@${size}x.png`;
  }

  private params(location: WeatherLocation): Record<string, string | number> {
    const base = { appid: this.apiKey, units: 'metric' };
    return 'city' in location
      ? { ...base, q: location.city }
      : { ...base, lat: location.lat, lon: location.lon };
  }

  private toForecast(response: ForecastResponse): Forecast {
    const offset = response.city.timezone;
    const localDate = (item: ForecastItem) => new Date((item.dt + offset) * 1000);

    const hourly = response.list.slice(0, 8).map(item => ({
      dt: item.dt,
      temp: item.main.temp,
      icon: item.weather[0].icon,
      description: item.weather[0].description,
      pop: item.pop,
    }));

    const days = new Map<string, ForecastItem[]>();
    for (const item of response.list) {
      const key = localDate(item).toISOString().slice(0, 10);
      days.set(key, [...(days.get(key) ?? []), item]);
    }

    const daily: DailyPoint[] = [...days.values()].map(items => {
      const distanceFromMidday = (item: ForecastItem) => Math.abs(localDate(item).getUTCHours() - 13);
      const midday = items.reduce((best, item) => distanceFromMidday(item) < distanceFromMidday(best) ? item : best);
      return {
        dt: items[0].dt,
        min: Math.min(...items.map(item => item.main.temp_min)),
        max: Math.max(...items.map(item => item.main.temp_max)),
        icon: midday.weather[0].icon.replace('n', 'd'),
        description: midday.weather[0].description,
        pop: Math.max(...items.map(item => item.pop)),
      };
    });

    return { hourly, daily };
  }
}
