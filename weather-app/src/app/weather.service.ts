import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiKey = '7434c68243142e3208ff238fde743f0d';
  private apiUrl = 'http://api.openweathermap.org/data/2.5';

  constructor(private http: HttpClient) { }

  getCurrentWeather(city: string): Observable<any> {
    const url = `${this.apiUrl}/weather?q=${city}&appid=${this.apiKey}&units=metric`;
    return this.http.get(url);
  }

  getForecast(city: string): Observable<any> {
    const url = `${this.apiUrl}/forecast?q=${city}&appid=${this.apiKey}&units=metric`;
    return this.http.get(url).pipe(
      map((response: any) => {
        return response.list.map((item: { dt_txt: any; main: { temp: any; }; weather: { description: any; }[]; }) => ({
          date: item.dt_txt,
          temp: item.main.temp,
          description: item.weather[0].description
        }));
      })
    );
  }

  getHourlyForecast(city: string): Observable<any> {
    const url = `${this.apiUrl}/forecast?q=${city}&appid=${this.apiKey}&units=metric`;
    return this.http.get(url).pipe(
      map((response: any) => {
        const currentDate = new Date().toDateString();
        return response.list.filter((item: { dt_txt: string | string[]; }) => item.dt_txt.includes(currentDate)).map((item: { dt_txt: string; main: { temp: any; }; weather: { description: any; }[]; }) => ({
          time: item.dt_txt.split(' ')[1],
          temp: item.main.temp,
          description: item.weather[0].description
        }));
      })
    );
  }
}
