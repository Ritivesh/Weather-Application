import { Routes } from '@angular/router';
import { CurrentWeatherComponent } from './current-weather/current-weather.component';

export const routes: Routes = [
    {
        path:"",
        component:CurrentWeatherComponent,
        title:"Weather-Forecast"
    }
];
