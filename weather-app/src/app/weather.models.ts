export interface Condition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  name: string;
  dt: number;
  timezone: number;
  visibility: number;
  coord: { lat: number; lon: number };
  sys: { country: string; sunrise: number; sunset: number };
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
    pressure: number;
  };
  wind: { speed: number; deg: number };
  clouds: { all: number };
  weather: Condition[];
}

export interface ForecastItem {
  dt: number;
  pop: number;
  main: { temp: number; temp_min: number; temp_max: number };
  weather: Condition[];
}

export interface ForecastResponse {
  list: ForecastItem[];
  city: { timezone: number };
}

export interface HourlyPoint {
  dt: number;
  temp: number;
  icon: string;
  description: string;
  pop: number;
}

export interface DailyPoint {
  dt: number;
  min: number;
  max: number;
  icon: string;
  description: string;
  pop: number;
}

export interface Forecast {
  hourly: HourlyPoint[];
  daily: DailyPoint[];
}

export type WeatherLocation = { city: string } | { lat: number; lon: number };
