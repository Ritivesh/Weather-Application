import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { WeatherService } from '../weather.service';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MapInitializeService } from '../map-initialize.service';

@Component({
  selector: 'app-current-weather',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  providers: [WeatherService],
  templateUrl: './current-weather.component.html',
  styleUrl: './current-weather.component.css'
})
export class CurrentWeatherComponent implements OnInit {
  cityName: any;
  currentWeather: any;
  forecastData: any;
  hourlyForecastData: any;
  maxTemp: any;
  weatherIconBaseUrl: string = 'https://www.awxcdn.com/adc-assets/images/weathericons/';
  selectedTime: any;

  constructor(private weatherService: WeatherService,private http:HttpClient,private mapInitializeService: MapInitializeService) { }

  ngOnInit(): void {
    this.getUserCity()
    this.getWeather();
  }

  getWeather() {
    if (this.cityName) {
      this.weatherService.getCurrentWeather(this.cityName).subscribe(currentWeatherData => {
        this.currentWeather = currentWeatherData;
        if (this.currentWeather?.coord) {
          this.mapInitializeService.updateMarker(this.currentWeather.coord.lat, this.currentWeather.coord.lon);
        }
      });

      this.weatherService.getForecast(this.cityName).subscribe(forecastData => {
        this.forecastData = forecastData;
       
      });

      this.weatherService.getHourlyForecast(this.cityName).subscribe(hourlyForecastData => {
        this.hourlyForecastData = hourlyForecastData;
      });
    
      this.calculateMaxTemp()
    }
  }

  getUserCity() {
    this.http.get('https://ipapi.co/json/').subscribe((response: any) => {
      console.log('User City:', response.city);
      this.cityName = response.city
      this.mapInitializeService.initializeMap('map', response.latitude, response.longitude);
      this.getWeather()
    })
  }

  onTimeChange(event: Event) {
    this.selectedTime = (event.target as HTMLInputElement).value;
  }

  calculateMaxTemp() {
    if (this.forecastData) {
      this.maxTemp = Math.max(...this.forecastData.map((forecast: { temp: any; }) => forecast.temp));
    }

  }

  calculatePointPosition(temperature: number): number {
    const minTemp = -10;
    const maxTemp = 40;
    const graphWidth = 100; 

    return ((temperature - minTemp) / (maxTemp - minTemp)) * graphWidth;
  }

  mapWeatherConditionToIcon(condition: any): string {
    switch (condition.description) {
      case 'clear sky':
        return '1.svg';
      case 'few clouds':
        return '2.svg';
      case 'light rain':
        return '3.svg';
      default:
        return '1.svg';
    }
  }

}

