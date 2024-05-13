import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { WeatherService } from '../weather.service';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

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

  constructor(private weatherService: WeatherService,private http:HttpClient) { }

  ngOnInit(): void {
    this.getUserCity()
    this.getWeather();
  }

  getWeather() {
    if (this.cityName) {
      this.weatherService.getCurrentWeather(this.cityName).subscribe(currentWeatherData => {
        this.currentWeather = currentWeatherData;
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
      this.getWeather()
      // You can use response.city to display the user's current city
    });
  }

  onTimeChange(event: Event) {
    this.selectedTime = (event.target as HTMLInputElement).value;
    // Implement logic to fetch weather data for the selected time
  }

  calculateMaxTemp() {
    if (this.forecastData) {
      this.maxTemp = Math.max(...this.forecastData.map((forecast: { temp: any; }) => forecast.temp));
    }

  }

  calculatePointPosition(temperature: number): number {
    // Assuming a temperature range of -10°C to 40°C for simplicity
    const minTemp = -10;
    const maxTemp = 40;
    const graphWidth = 100; // Width of the graph in percentage

    // Calculate the position of the point based on temperature range
    return ((temperature - minTemp) / (maxTemp - minTemp)) * graphWidth;
  }

  mapWeatherConditionToIcon(condition: string): string {
    switch (condition) {
      case 'clear':
        return '1.svg';
      case 'cloudy':
        return '2.svg';
      case 'rainy':
        return '3.svg';
      // Add more cases as needed
      default:
        return '1.svg';
    }
  }

}

